import { GAME_CONFIG } from "../config/gameConfig";
import { createReplacementOrder, createSpecialOrder, specialVisitorById } from "../data/orderData";
import { unlockedFamilies } from "../data/itemData";
import { PhaserGame } from "../game/PhaserGame";
import { addItemsToBoard, removeItemsForOrder } from "../systems/boardSystem";
import { clearRememberedAccess } from "../utils/access";
import { createDefaultSaveGame, loadSaveGame, persistSaveGame } from "../systems/saveSystem";
import type { BoardChangeMeta, BoardState, ItemFamily, ItemLevel, SaveGame } from "../types/game";
import { renderTownView } from "./TownView";
import type { TownAreaId } from "../types/content";
import { isAreaUnlocked } from "../systems/areaSystem";
import { areaItemName } from "../data/areaItemData";
import { StudioView } from "./StudioView";

export class GameApp {
  private readonly host: HTMLElement;
  private state: SaveGame;
  private phaser?: PhaserGame;
  private studio?: StudioView;
  private readonly toastLayer: HTMLElement;

  public constructor(host: HTMLElement) {
    this.host = host;
    this.state = loadSaveGame();
    this.toastLayer = document.createElement("div");
    this.toastLayer.className = "feedback-layer";
    document.body.appendChild(this.toastLayer);
    this.showTown();
  }

  public showTown(): void {
    this.destroyBoard();
    window.scrollTo(0, 0);
    renderTownView(this.host, this.state, {
      onEnterStudio: () => this.showArea("drawing-studio"),
      onEnterArea: (areaId) => this.showArea(areaId),
      onResetSave: () => this.resetSave()
    });
    window.setTimeout(() => window.scrollTo(0, 0), 0);
  }

  private showArea(areaId: TownAreaId): void {
    if (!isAreaUnlocked(areaId, this.state.lifetimeCoins, this.state.studioLevel)) {
      this.showToast("Keep helping the village to open this place.");
      return;
    }
    this.state.activeArea = areaId;
    this.state.activeFamily = areaId === "drawing-studio" ? "drawing" : areaId === "kitchen-table" || areaId === "windowsill-greenhouse" ? "collage" : "prints";
    this.state.areas[areaId].unlocked = true;
    this.state.board = this.state.areas[areaId].board;
    this.state.orders = this.state.areas[areaId].orders;
    this.state.orderSequence = this.state.areas[areaId].orderSequence;
    persistSaveGame(this.state);
    this.showStudio();
  }

  public showStudio(): void {
    this.destroyBoard();
    window.scrollTo(0, 0);
    this.studio = new StudioView(this.host, this.state, {
      onBack: () => this.showTown(),
      onDeliver: (orderId) => this.deliverOrder(orderId),
      onDeliverSpecial: () => this.deliverSpecialOrder(),
      onDeliverMasterpiece: () => this.deliverMasterpieceOrder(),
      onSelectFamily: (family) => this.selectFamily(family),
      onSpecialExpired: () => this.expireSpecialOrderIfNeeded(),
      onRestore: () => this.restoreStudio(),
      onResetSave: () => this.resetSave()
    });
    this.phaser = new PhaserGame(this.studio.boardElement, this.state.board, {
      onBoardChange: (board, meta) => this.handleBoardChange(board, meta),
      onProducerMove: (slot) => this.handleProducerMove(slot),
      onToast: (message) => this.showToast(message)
    }, this.state.activeFamily, this.state.areas[this.state.activeArea].producerSlot);
    this.expireSpecialOrderIfNeeded();
    window.setTimeout(() => window.scrollTo(0, 0), 0);
  }

  private selectFamily(family: ItemFamily): void {
    if (!unlockedFamilies(this.state.studioLevel).includes(family)) return;
    this.state.activeFamily = family; persistSaveGame(this.state); this.phaser?.setActiveFamily(family); this.studio?.update(this.state);
  }

  private handleBoardChange(board: BoardState, meta: BoardChangeMeta): void {
    this.state.board = board;
    this.state.areas[this.state.activeArea].board = board;
    if (meta.kind === "produce") {
      this.discover(meta.producedLevel);
    }
    if (meta.kind === "merge") {
      this.discover(meta.resultLevel);
      this.maybeCreateMasterpieceOrder(meta.family);
    }
    persistSaveGame(this.state);
    this.studio?.update(this.state);
  }

  private handleProducerMove(slot: number): void {
    this.state.areas[this.state.activeArea].producerSlot = slot;
    persistSaveGame(this.state);
  }

  private deliverOrder(orderId: string): void {
    const order = this.state.orders.find((candidate) => candidate.id === orderId);
    if (!order) {
      return;
    }
    const removed = removeItemsForOrder(this.state.board, order.requestedLevel, order.quantity, undefined, this.state.areas[this.state.activeArea].producerSlot);
    if (!removed) {
      this.showToast("That request is not ready quite yet.");
      return;
    }
    this.state.board = removed.board;
    this.state.areas[this.state.activeArea].board = this.state.board;
    this.state.coins += order.reward;
    const remaining = this.state.orders.filter((candidate) => candidate.id !== order.id);
    const replacement = createReplacementOrder(this.state.orderSequence, remaining, unlockedFamilies(this.state.studioLevel));
    this.state.orderSequence += 1;
    this.state.orders = [...remaining, replacement];
    this.state.areas[this.state.activeArea].orders = this.state.orders;
    this.state.areas[this.state.activeArea].orderSequence = this.state.orderSequence;
    this.state.regularOrdersCompleted += 1;
    this.state.areas[this.state.activeArea].completedOrders += 1;
    this.maybeCreateSpecialOrder();
    this.addEarnings(order.reward);
    persistSaveGame(this.state);
    this.phaser?.syncBoard(this.state.board);
    this.studio?.update(this.state);
    this.studio?.animateCoins();
    this.studio?.showFeedback(`${order.customer === "mia" ? "Mia" : order.customer === "leo" ? "Leo" : "Ivy"} loved it. +${order.reward} coins!`, "success");
  }

  private addEarnings(amount: number): void {
    this.state.lifetimeCoins += amount;
    const nextLevel = this.state.lifetimeCoins >= GAME_CONFIG.progression.levelThreeCoins ? 3 : this.state.lifetimeCoins >= GAME_CONFIG.progression.levelTwoCoins ? 2 : 1;
    if (nextLevel > this.state.studioLevel) {
      this.state.studioLevel = nextLevel as 1 | 2 | 3;
      this.state.activeFamily = nextLevel === 2 ? "collage" : "prints";
      this.phaser?.setActiveFamily(this.state.activeFamily);
      this.showToast(`${nextLevel === 2 ? "Paper Collage" : "Little Prints"} is now open in the studio!`, "success");
    }
  }

  private maybeCreateMasterpieceOrder(family: ItemFamily): void {
    if (this.state.masterpieceOrder || this.state.board.filter((item) => item?.family === family && item.level === 7).length < GAME_CONFIG.progression.masterpieceQuantity) return;
    const rewards: Record<ItemFamily, number> = { drawing: 460, collage: 650, prints: 860 };
    this.state.masterpieceOrder = { id: `collector-${this.state.masterpieceOrderSequence + 1}`, family, quantity: 2, reward: rewards[family] };
    this.state.masterpieceOrderSequence += 1;
    this.showToast("A collector has made an offer for two masterpieces!", "success");
  }

  private deliverMasterpieceOrder(): void {
    const order = this.state.masterpieceOrder;
    if (!order) return;
    const removed = removeItemsForOrder(this.state.board, 7, order.quantity, order.family, this.state.areas[this.state.activeArea].producerSlot);
    if (!removed) return;
    this.state.board = removed.board; this.state.areas[this.state.activeArea].board = this.state.board; this.state.coins += order.reward; this.addEarnings(order.reward); this.state.masterpieceOrder = null;
    persistSaveGame(this.state); this.phaser?.syncBoard(this.state.board); this.studio?.update(this.state); this.studio?.animateCoins();
    this.studio?.showFeedback(`Collector's sale complete. +${order.reward} coins for the village!`, "success");
  }

  private maybeCreateSpecialOrder(): void {
    if (this.state.specialOrder || this.state.regularOrdersCompleted < this.state.nextSpecialOrderAt) return;
    this.state.specialOrder = createSpecialOrder(this.state.specialOrderSequence, this.state.buildings.drawingStudioStage === 1, this.state.activeFamily);
    this.state.specialOrderSequence += 1;
    this.state.nextSpecialOrderAt += GAME_CONFIG.specialVisit.everyRegularOrders;
    this.showToast("A travelling curator has arrived with a special request!", "success");
  }

  private deliverSpecialOrder(): void {
    const order = this.state.specialOrder;
    if (!order) return;
    if (Date.now() >= order.expiresAt) {
      this.expireSpecialOrderIfNeeded();
      return;
    }
    const producerSlot = this.state.areas[this.state.activeArea].producerSlot;
    const removed = removeItemsForOrder(this.state.board, order.requestedLevel, order.quantity, order.family, producerSlot);
    if (!removed) {
      this.showToast("Margo is still waiting for that special piece.");
      return;
    }
    const reward = addItemsToBoard(removed.board, order.bonusItemLevels, (level) => this.createRewardItem(level), producerSlot);
    const overflowCoins = reward.unplaced.length * GAME_CONFIG.specialVisit.fallbackCoinsPerSupply;
    this.state.board = reward.board;
    this.state.areas[this.state.activeArea].board = this.state.board;
    this.state.coins += order.coinReward + overflowCoins;
    this.state.specialOrder = null;
    reward.placed.forEach((level) => this.discover(level));
    persistSaveGame(this.state);
    this.phaser?.syncBoard(this.state.board);
    this.studio?.update(this.state);
    this.studio?.animateCoins();
    const visitor = specialVisitorById(order.visitor);
    const supplies = reward.placed.length === 1 ? "a studio supply" : `${reward.placed.length} studio supplies`;
    this.studio?.showFeedback(`${visitor.name} was delighted. +${order.coinReward + overflowCoins} coins and ${supplies}!`, "success");
  }

  private expireSpecialOrderIfNeeded(): void {
    const order = this.state.specialOrder;
    if (!order || Date.now() < order.expiresAt) return;
    this.state.specialOrder = null;
    persistSaveGame(this.state);
    this.studio?.update(this.state);
    this.showToast("Margo has continued on her travels. Another visit will come by.");
  }

  private createRewardItem(level: ItemLevel): import("../types/game").BoardItem {
    return { id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, family: "drawing", level, createdAt: Date.now() };
  }

  private restoreStudio(): void {
    if (this.state.buildings.drawingStudioStage === 1) {
      return;
    }
    const cost = GAME_CONFIG.restoration.firstCost;
    if (this.state.coins < cost) {
      this.showToast(`The studio needs ${cost - this.state.coins} more coins.`);
      return;
    }
    this.state.coins -= cost;
    this.state.buildings.drawingStudioStage = 1;
    persistSaveGame(this.state);
    this.studio?.update(this.state);
    this.studio?.animateCoins();
    this.studio?.showFeedback("The Drawing Studio is coming back to life!", "success");
    this.showToast("The Drawing Studio is coming back to life!", "success");
  }

  private discover(level: ItemLevel): void {
    if (this.state.discoveries.includes(level)) {
      return;
    }
    this.state.discoveries = [...this.state.discoveries, level].sort((a, b) => a - b);
    persistSaveGame(this.state);
    this.showDiscovery(level);
  }

  private showDiscovery(level: ItemLevel): void {
    const existing = document.querySelector(".discovery-banner");
    existing?.remove();
    const itemName = areaItemName(this.state.activeArea, level);
    const banner = document.createElement("div");
    banner.className = "discovery-banner";
    banner.innerHTML = `<span class="discovery-spark">✦</span><div><small>NEW DISCOVERY!</small><strong>${itemName}</strong></div>`;
    document.body.appendChild(banner);
    window.setTimeout(() => banner.classList.add("is-visible"), 20);
    window.setTimeout(() => {
      banner.classList.remove("is-visible");
      window.setTimeout(() => banner.remove(), 260);
    }, 2200);
  }

  private showToast(message: string, kind: "normal" | "success" = "normal"): void {
    const toast = document.createElement("div");
    toast.className = `toast ${kind === "success" ? "is-success" : ""}`;
    toast.textContent = message;
    this.toastLayer.appendChild(toast);
    window.setTimeout(() => toast.classList.add("is-visible"), 20);
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  private resetSave(): void {
    const confirmed = window.confirm("Start your little world over? This clears the board, coins, orders, and restoration.");
    if (!confirmed) {
      return;
    }
    this.state = createDefaultSaveGame();
    persistSaveGame(this.state);
    clearRememberedAccess();
    this.showTown();
  }

  private destroyBoard(): void {
    this.phaser?.destroy();
    this.phaser = undefined;
    this.studio?.destroy();
    this.studio = undefined;
  }
}
