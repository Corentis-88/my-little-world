import { GAME_CONFIG } from "../config/gameConfig";
import { ITEM_BY_LEVEL } from "../data/itemData";
import { customerById, specialVisitorById } from "../data/orderData";
import { countItemsAtLevel } from "../systems/boardSystem";
import type { Order, SaveGame, SpecialOrder } from "../types/game";
import { assetUrl } from "../utils/assets";

export type StudioViewHandlers = {
  onBack: () => void;
  onDeliver: (orderId: string) => void;
  onDeliverSpecial: () => void;
  onSpecialExpired: () => void;
  onRestore: () => void;
  onResetSave: () => void;
};

export class StudioView {
  private readonly host: HTMLElement;
  private readonly handlers: StudioViewHandlers;
  private readonly coinValue: HTMLElement;
  private readonly ordersHost: HTMLElement;
  private readonly visitorHost: HTMLElement;
  private readonly boardMount: HTMLElement;
  private readonly restoreCopy: HTMLElement;
  private readonly restoreButton: HTMLButtonElement;
  private readonly feedback: HTMLElement;
  private ticker?: number;
  private expiringSpecialId?: string;

  public constructor(host: HTMLElement, save: SaveGame, handlers: StudioViewHandlers) {
    this.host = host;
    this.handlers = handlers;
    this.host.innerHTML = `
      <main class="studio-screen">
        <header class="topbar studio-topbar">
          <button class="back-button" type="button"><span aria-hidden="true">←</span><span>Town</span></button>
          <div class="studio-title"><span class="studio-brush-mark">✦</span><div><p class="eyebrow">Now making</p><h1>The Drawing Studio</h1></div></div>
          <div class="topbar-actions"><div class="coin-pill studio-coin" aria-label="${save.coins} coins"><img src="${assetUrl("coin.svg")}" alt="" /><strong class="coin-value">${save.coins}</strong></div><button class="icon-button reset-button" type="button" aria-label="Reset save" title="Reset save">↺</button></div>
        </header>
        <section class="orders-section" aria-labelledby="orders-title">
          <div class="orders-heading"><div><p class="eyebrow">Little requests</p><h2 id="orders-title">Customer orders</h2></div><span class="order-count">3 waiting</span></div>
          <div class="orders-list"></div>
        </section>
        <section class="visitor-section" aria-live="polite"></section>
        <section class="board-section" aria-labelledby="board-title">
          <div class="board-heading"><div><p class="eyebrow">Make a little magic</p><h2 id="board-title">The artist's desk</h2></div><span class="board-tip">drag to merge</span></div>
          <div class="board-shell"><div class="phaser-mount"></div><div class="board-instruction"><span class="instruction-spark">✦</span> Tap the desk to draw</div></div>
        </section>
        <section class="restore-panel" aria-labelledby="restore-title">
          <div class="restore-icon">✦</div>
          <div class="restore-copy"><p class="eyebrow">A brighter tomorrow</p><h2 id="restore-title">${save.buildings.drawingStudioStage === 1 ? "Studio restored" : "Restore Drawing Studio"}</h2><p class="restore-status"></p></div>
          <button class="primary-button restore-button" type="button"></button>
        </section>
        <p class="studio-feedback" aria-live="polite"></p>
      </main>
    `;
    this.coinValue = requiredElement(this.host, ".coin-value");
    this.ordersHost = requiredElement(this.host, ".orders-list");
    this.visitorHost = requiredElement(this.host, ".visitor-section");
    this.boardMount = requiredElement(this.host, ".phaser-mount");
    this.restoreCopy = requiredElement(this.host, ".restore-status");
    this.restoreButton = requiredElement(this.host, ".restore-button");
    this.feedback = requiredElement(this.host, ".studio-feedback");
    this.host.querySelector<HTMLButtonElement>(".back-button")?.addEventListener("click", handlers.onBack);
    this.host.querySelector<HTMLButtonElement>(".reset-button")?.addEventListener("click", handlers.onResetSave);
    this.restoreButton.addEventListener("click", handlers.onRestore);
    this.update(save);
  }

  public get boardElement(): HTMLElement {
    return this.boardMount;
  }

  public update(save: SaveGame): void {
    this.coinValue.textContent = `${save.coins}`;
    this.host.querySelector<HTMLElement>(".studio-coin")?.setAttribute("aria-label", `${save.coins} coins`);
    this.renderOrders(save);
    this.renderSpecialOrder(save);
    this.renderRestoration(save);
  }

  public destroy(): void {
    if (this.ticker !== undefined) {
      window.clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  public animateCoins(): void {
    const pill = this.host.querySelector<HTMLElement>(".studio-coin");
    pill?.classList.remove("coin-reward");
    void pill?.offsetWidth;
    pill?.classList.add("coin-reward");
    window.setTimeout(() => pill?.classList.remove("coin-reward"), 700);
  }

  public showFeedback(message: string, kind: "normal" | "success" = "normal"): void {
    this.feedback.textContent = message;
    this.feedback.classList.toggle("is-success", kind === "success");
    this.feedback.classList.remove("feedback-pop");
    void this.feedback.offsetWidth;
    this.feedback.classList.add("feedback-pop");
    window.setTimeout(() => {
      this.feedback.textContent = "";
      this.feedback.classList.remove("is-success", "feedback-pop");
    }, 3600);
  }

  private renderOrders(save: SaveGame): void {
    this.ordersHost.innerHTML = save.orders.map((order) => this.renderOrder(order, save)).join("");
    this.ordersHost.querySelectorAll<HTMLButtonElement>("[data-deliver]").forEach((button) => {
      button.addEventListener("click", () => this.handlers.onDeliver(button.dataset.deliver ?? ""));
    });
  }

  private renderOrder(order: Order, save: SaveGame): string {
    const customer = customerById(order.customer);
    const item = ITEM_BY_LEVEL[order.requestedLevel];
    const ready = countItemsAtLevel(save.board, order.requestedLevel) >= order.quantity;
    return `
      <article class="order-card ${ready ? "is-ready" : ""}">
        <img class="customer-portrait" src="${assetUrl(customer.portrait)}" alt="${customer.name}" />
        <div class="order-copy"><div class="order-name"><strong>${customer.name}</strong><span>${customer.greeting}</span></div><div class="order-request"><img src="${assetUrl(item.asset)}" alt="${item.name}" /><span>${item.name}${order.quantity > 1 ? ` ×${order.quantity}` : ""}</span></div></div>
        <div class="order-action"><span class="reward"><img src="${assetUrl("coin.svg")}" alt="" />+${order.reward}</span><button class="deliver-button" type="button" data-deliver="${order.id}" ${ready ? "" : "disabled"}>${ready ? "Deliver ✦" : "Make it"}</button></div>
      </article>
    `;
  }

  private renderSpecialOrder(save: SaveGame): void {
    const order = save.specialOrder;
    if (!order) {
      this.visitorHost.innerHTML = "";
      this.destroy();
      return;
    }
    const render = () => {
      const secondsLeft = Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));
      if (secondsLeft === 0 && this.expiringSpecialId !== order.id) {
        this.expiringSpecialId = order.id;
        this.handlers.onSpecialExpired();
        return;
      }
      const ready = countItemsAtLevel(save.board, order.requestedLevel) >= order.quantity;
      this.visitorHost.innerHTML = this.renderSpecialOrderCard(order, ready, secondsLeft);
      this.visitorHost.querySelector<HTMLButtonElement>("[data-deliver-special]")?.addEventListener("click", this.handlers.onDeliverSpecial);
    };
    render();
    if (this.ticker === undefined) this.ticker = window.setInterval(render, 1000);
  }

  private renderSpecialOrderCard(order: SpecialOrder, ready: boolean, secondsLeft: number): string {
    const visitor = specialVisitorById(order.visitor);
    const item = ITEM_BY_LEVEL[order.requestedLevel];
    const time = secondsLeft <= 0 ? "Leaving now" : formatTime(secondsLeft);
    return `
      <article class="visitor-card ${ready ? "is-ready" : ""}">
        <div class="visitor-label">✦ Visiting request <span>${time}</span></div>
        <div class="visitor-main"><img class="visitor-portrait" src="${assetUrl(visitor.portrait)}" alt="${visitor.name}" /><div class="visitor-copy"><div class="order-name"><strong>${visitor.name}</strong><span>${visitor.greeting}</span></div><div class="order-request"><img src="${assetUrl(item.asset)}" alt="${item.name}" /><span>${item.name}</span></div></div><button class="deliver-button visitor-button" type="button" data-deliver-special ${ready && secondsLeft > 0 ? "" : "disabled"}>${ready ? "Deliver ✦" : "Make it"}</button></div>
        <div class="visitor-rewards"><span><img src="${assetUrl("coin.svg")}" alt="" />+${order.coinReward}</span><span>plus supplies</span>${order.bonusItemLevels.map((level) => `<img src="${assetUrl(ITEM_BY_LEVEL[level].asset)}" alt="${ITEM_BY_LEVEL[level].name}" />`).join("")}</div>
      </article>`;
  }

  private renderRestoration(save: SaveGame): void {
    const restored = save.buildings.drawingStudioStage === 1;
    const cost = GAME_CONFIG.restoration.firstCost;
    if (restored) {
      this.restoreCopy.textContent = "The windows are open and the colour is back.";
      this.restoreButton.textContent = "RESTORED ✦";
      this.restoreButton.disabled = true;
      this.restoreButton.classList.add("is-complete");
      return;
    }
    this.restoreCopy.textContent = `${Math.min(save.coins, cost)} / ${cost} coins`;
    this.restoreButton.textContent = save.coins >= cost ? "RESTORE ✨" : "KEEP MAKING";
    this.restoreButton.disabled = save.coins < cost;
    this.restoreButton.classList.remove("is-complete");
  }
}

function requiredElement<T extends HTMLElement>(host: HTMLElement, selector: string): T {
  const element = host.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing studio element: ${selector}`);
  }
  return element;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
