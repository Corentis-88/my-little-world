import { GAME_CONFIG } from "../config/gameConfig";
import { createReplacementOrder, createSpecialOrder, specialVisitorById } from "../data/orderData";
import { PhaserGame } from "../game/PhaserGame";
import { addItemsToBoard, removeItemsForOrder } from "../systems/boardSystem";
import { clearRememberedAccess } from "../utils/access";
import { createDefaultSaveGame, loadSaveGame, persistSaveGame } from "../systems/saveSystem";
import type { BoardChangeMeta, BoardState, ItemLevel, SaveGame } from "../types/game";
import { renderTownView } from "./TownView";
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
      onEnterStudio: () => this.showStudio(),
      onResetSave: () => this.resetSave()
    });
    window.setTimeout(() => window.scrollTo(0, 0), 0);
  }

  public showStudio(): void {
    this.destroyBoard();
    window.scrollTo(0, 0);
    this.studio = new StudioView(this.host, this.state, {
      onBack: () => this.showTown(),
      onDeliver: (orderId) => this.deliverOrder(orderId),
      onDeliverSpecial: () => this.deliverSpecialOrder(),
      onSpecialExpired: () => this.expireSpecialOrderIfNeeded(),
      onRestore: () => this.restoreStudio(),
      onResetSave: () => this.resetSave()
    });
    this.phaser = new PhaserGame(this.studio.boardElement, this.state.board, {
      onBoardChange: (board, meta) => this.handleBoardChange(board, meta),
      onToast: (message) => this.showToast(message)
    });
    this.expireSpecialOrderIfNeeded();
    window.setTimeout(() => window.scrollTo(0, 0), 0);
  }

  private handleBoardChange(board: BoardState, meta: BoardChangeMeta): void {
    this.state.board = board;
    if (meta.kind === "produce") {
      this.discover(meta.producedLevel);
    }
    if (meta.kind === "merge") {
      this.discover(meta.resultLevel);
    }
    persistSaveGame(this.state);
    this.studio?.update(this.state);
  }

  private deliverOrder(orderId: string): void {
    const order = this.state.orders.find((candidate) => candidate.id === orderId);
    if (!order) {
      return;
    }
    const removed = removeItemsForOrder(this.state.board, order.requestedLevel, order.quantity);
    if (!removed) {
      this.showToast("That request is not ready quite yet.");
      return;
    }
    this.state.board = removed.board;
    this.state.coins += order.reward;
    const remaining = this.state.orders.filter((candidate) => candidate.id !== order.id);
    const replacement = createReplacementOrder(this.state.orderSequence, remaining);
    this.state.orderSequence += 1;
    this.state.orders = [...remaining, replacement];
    this.state.regularOrdersCompleted += 1;
    this.maybeCreateSpecialOrder();
    persistSaveGame(this.state);
    this.phaser?.syncBoard(this.state.board);
    this.studio?.update(this.state);
    this.studio?.animateCoins();
    this.studio?.showFeedback(`${order.customer === "mia" ? "Mia" : order.customer === "leo" ? "Leo" : "Ivy"} loved it. +${order.reward} coins!`, "success");
  }

  private maybeCreateSpecialOrder(): void {
    if (this.state.specialOrder || this.state.regularOrdersCompleted < this.state.nextSpecialOrderAt) return;
    this.state.specialOrder = createSpecialOrder(this.state.specialOrderSequence, this.state.buildings.drawingStudioStage === 1);
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
    const removed = removeItemsForOrder(this.state.board, order.requestedLevel, order.quantity);
    if (!removed) {
      this.showToast("Margo is still waiting for that special piece.");
      return;
    }
    const reward = addItemsToBoard(removed.board, order.bonusItemLevels, (level) => this.createRewardItem(level));
    const overflowCoins = reward.unplaced.length * GAME_CONFIG.specialVisit.fallbackCoinsPerSupply;
    this.state.board = reward.board;
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

  private createRewardItem(level: ItemLevel) {
    return { id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, level, createdAt: Date.now() };
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
    const itemName = ["Pencil", "Coloured Pencils", "Paintbrush", "Paint Set", "Sketch", "Finished Drawing", "Beautiful Artwork"][level - 1];
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
