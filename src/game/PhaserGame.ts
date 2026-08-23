import Phaser from "phaser";
import { GAME_CONFIG, PRODUCER_SLOT } from "../config/gameConfig";
import { ITEM_DEFINITIONS } from "../data/itemData";
import { mergeItems, moveItem, produceItem } from "../systems/boardSystem";
import type { BoardChangeMeta, BoardState, ItemLevel } from "../types/game";
import { assetUrl } from "../utils/assets";

export type MergeGameCallbacks = {
  onBoardChange: (board: BoardState, meta: BoardChangeMeta) => void;
  onToast: (message: string) => void;
};

type DragState = {
  origin: number;
  target: number | null;
};

export class PhaserGame {
  private readonly game: Phaser.Game;
  private readonly blockNativePress: (event: Event) => void;
  private readonly parent: HTMLElement;

  public constructor(parent: HTMLElement, board: BoardState, callbacks: MergeGameCallbacks) {
    this.parent = parent;
    this.blockNativePress = (event) => event.preventDefault();
    parent.style.setProperty("-webkit-touch-callout", "none");
    parent.addEventListener("contextmenu", this.blockNativePress);
    parent.addEventListener("selectstart", this.blockNativePress);
    parent.addEventListener("dragstart", this.blockNativePress);
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: GAME_CONFIG.board.width,
      height: GAME_CONFIG.board.height,
      transparent: true,
      backgroundColor: "#00000000",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_CONFIG.board.width,
        height: GAME_CONFIG.board.height
      },
      render: {
        antialias: true,
        roundPixels: true
      },
      input: {
        activePointers: 2
      },
      scene: [new MergeScene(board, callbacks)
      ]
    });
  }

  public syncBoard(board: BoardState): void {
    const scene = this.game.scene.getScene("MergeScene");
    if (scene instanceof MergeScene) {
      scene.syncBoard(board);
    }
  }

  public destroy(): void {
    this.parent.removeEventListener("contextmenu", this.blockNativePress);
    this.parent.removeEventListener("selectstart", this.blockNativePress);
    this.parent.removeEventListener("dragstart", this.blockNativePress);
    this.game.destroy(true);
  }
}

class MergeScene extends Phaser.Scene {
  private board: BoardState;
  private readonly callbacks: MergeGameCallbacks;
  private readonly itemSprites = new Map<number, Phaser.GameObjects.Image>();
  private boardGraphics?: Phaser.GameObjects.Graphics;
  private targetGraphics?: Phaser.GameObjects.Graphics;
  private producerSprite?: Phaser.GameObjects.Image;
  private dragState: DragState | null = null;
  private readonly reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  public constructor(board: BoardState, callbacks: MergeGameCallbacks) {
    super({ key: "MergeScene" });
    this.board = board;
    this.callbacks = callbacks;
  }

  public preload(): void {
    this.load.svg("artist-desk", assetUrl("artist-desk.svg"), { width: 280, height: 220 });
    ITEM_DEFINITIONS.forEach((definition) => {
      this.load.svg(`item-${definition.level}`, assetUrl(definition.asset), { width: 128, height: 128 });
    });
  }

  public create(): void {
    this.input.dragDistanceThreshold = 10;
    this.input.dragTimeThreshold = 0;
    this.boardGraphics = this.add.graphics();
    this.targetGraphics = this.add.graphics().setDepth(2);
    this.drawBoard();
    this.createProducer();
    this.bindDragEvents();
    this.renderItems();
  }

  public syncBoard(board: BoardState): void {
    this.board = board.map((item) => (item ? { ...item } : null));
    if (this.scene.isActive()) {
      this.renderItems();
    }
  }

  private drawBoard(): void {
    const graphics = this.boardGraphics;
    if (!graphics) {
      return;
    }
    graphics.clear();
    graphics.fillStyle(0xf8ebd3, 0.94);
    graphics.fillRoundedRect(13, 9, 674, 866, 34);
    graphics.lineStyle(3, 0xe3cda7, 0.9);
    graphics.strokeRoundedRect(13, 9, 674, 866, 34);
    for (let index = 0; index < this.board.length; index += 1) {
      const { x, y } = this.cellCenter(index);
      const empty = index !== PRODUCER_SLOT && this.board[index] === null;
      graphics.fillStyle(empty ? 0xf2dfbd : 0xecd4aa, empty ? 0.58 : 0.38);
      graphics.fillRoundedRect(x - 39, y - 39, 78, 78, 20);
      graphics.lineStyle(2, 0xe2c69b, empty ? 0.38 : 0.18);
      graphics.strokeRoundedRect(x - 39, y - 39, 78, 78, 20);
    }
    const producer = this.cellCenter(PRODUCER_SLOT);
    graphics.fillStyle(0xd3af79, 0.28);
    graphics.fillRoundedRect(producer.x - 40, producer.y - 40, 80, 80, 20);
  }

  private createProducer(): void {
    const { x, y } = this.cellCenter(PRODUCER_SLOT);
    this.producerSprite = this.add.image(x, y - 5, "artist-desk").setDisplaySize(82, 68).setDepth(8);
    this.producerSprite.setInteractive({ useHandCursor: true });
    this.producerSprite.on(Phaser.Input.Events.POINTER_DOWN, () => this.produce());
  }

  private bindDragEvents(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, this.handleDragStart, this);
    this.input.on(Phaser.Input.Events.DRAG, this.handleDrag, this);
    this.input.on(Phaser.Input.Events.DRAG_END, this.handleDragEnd, this);
  }

  private renderItems(): void {
    this.itemSprites.forEach((sprite) => sprite.destroy());
    this.itemSprites.clear();
    for (let index = 0; index < this.board.length; index += 1) {
      const item = this.board[index];
      if (!item || index === PRODUCER_SLOT) {
        continue;
      }
      const { x, y } = this.cellCenter(index);
      const sprite = this.add.image(x, y, `item-${item.level}`).setDisplaySize(72, 72).setDepth(10);
      sprite.setInteractive({ useHandCursor: true });
      this.input.setDraggable(sprite);
      sprite.setData("slot", index);
      this.itemSprites.set(index, sprite);
    }
  }

  private produce(): void {
    const result = produceItem(this.board, Math.random, (level) => this.createBoardItem(level));
    if (!result) {
      this.callbacks.onToast("The studio is full — make a little room first.");
      this.pulseProducer();
      return;
    }
    this.board = result.board;
    this.callbacks.onBoardChange(this.board, { kind: "produce", producedLevel: result.level });
    this.renderItems();
    const sprite = this.itemSprites.get(result.slot);
    if (sprite) {
      sprite.setScale(0.1);
      this.tween(sprite, { scale: 1, duration: 180, ease: "Back.Out" });
    }
    this.pulseProducer();
  }

  private handleDragStart(_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject): void {
    if (!(gameObject instanceof Phaser.GameObjects.Image)) {
      return;
    }
    const origin = gameObject.getData("slot");
    if (typeof origin !== "number") {
      return;
    }
    this.dragState = { origin, target: null };
    gameObject.setDepth(30);
    gameObject.setScale(1.14);
    this.clearTarget();
  }

  private handleDrag(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
    dragX: number,
    dragY: number
  ): void {
    if (!(gameObject instanceof Phaser.GameObjects.Image) || !this.dragState) {
      return;
    }
    gameObject.x = dragX;
    gameObject.y = dragY;
    const target = this.slotAt(dragX, dragY);
    this.dragState.target = target;
    if (target !== null && target !== this.dragState.origin && target !== PRODUCER_SLOT) {
      this.showTarget(target, true);
    } else {
      this.clearTarget();
    }
  }

  private handleDragEnd(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject): void {
    if (!(gameObject instanceof Phaser.GameObjects.Image) || !this.dragState) {
      return;
    }
    const origin = this.dragState.origin;
    const target = this.slotAt(pointer.x, pointer.y);
    this.dragState = null;
    this.clearTarget();
    if (target === null || target === PRODUCER_SLOT) {
      this.returnSprite(gameObject, origin);
      return;
    }
    const targetItem = this.board[target];
    if (targetItem === null) {
      const moved = moveItem(this.board, origin, target);
      if (moved) {
        this.board = moved;
        this.callbacks.onBoardChange(this.board, { kind: "move", from: origin, to: target });
        this.renderItems();
        return;
      }
      this.returnSprite(gameObject, origin);
      return;
    }
    const merged = mergeItems(this.board, origin, target, (level) => this.createBoardItem(level));
    if (!merged) {
      this.callbacks.onToast("Those two need a matching colour to join.");
      this.returnSprite(gameObject, origin);
      return;
    }
    this.board = merged.board;
    this.callbacks.onBoardChange(this.board, { kind: "merge", from: origin, to: target, resultLevel: merged.resultLevel });
    this.renderItems();
    const resultSprite = this.itemSprites.get(target);
    if (resultSprite) {
      resultSprite.setScale(0.18);
      this.tween(resultSprite, { scale: 1, duration: 220, ease: "Back.Out" });
    }
    this.burstAt(this.cellCenter(target), this.definitionColor(merged.resultLevel));
    if (!this.reducedMotion) {
      this.cameras.main.flash(110, 255, 244, 196, false);
      this.cameras.main.shake(80, 0.0025);
    }
  }

  private returnSprite(sprite: Phaser.GameObjects.Image, origin: number): void {
    const { x, y } = this.cellCenter(origin);
    sprite.setDepth(10);
    this.tween(sprite, { x, y, scale: 1, duration: this.reducedMotion ? 0 : 150, ease: "Quad.Out" });
  }

  private showTarget(index: number, valid = true): void {
    const graphics = this.targetGraphics;
    if (!graphics) {
      return;
    }
    const { x, y } = this.cellCenter(index);
    graphics.clear();
    graphics.fillStyle(valid ? 0xf4b55f : 0xd77962, 0.22);
    graphics.fillRoundedRect(x - 43, y - 43, 86, 86, 22);
    graphics.lineStyle(5, valid ? 0xf0a34e : 0xd77962, 0.8);
    graphics.strokeRoundedRect(x - 43, y - 43, 86, 86, 22);
  }

  private clearTarget(): void {
    this.targetGraphics?.clear();
  }

  private pulseProducer(): void {
    const sprite = this.producerSprite;
    if (!sprite) {
      return;
    }
    sprite.setScale(1);
    this.tween(sprite, { scaleX: 1.08, scaleY: 1.08, duration: 90, yoyo: true, hold: 30, ease: "Sine.Out" });
  }

  private burstAt(position: { x: number; y: number }, color: number): void {
    const count = this.reducedMotion ? 4 : 9;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const distance = this.reducedMotion ? 28 : 44;
      const dot = this.add.circle(position.x, position.y, this.reducedMotion ? 3 : 4, color, 0.95).setDepth(25);
      this.tween(dot, {
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.3,
        duration: this.reducedMotion ? 120 : 300,
        ease: "Quad.Out",
        onComplete: () => dot.destroy()
      });
    }
  }

  private tween(target: Phaser.GameObjects.GameObject, config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, "targets">): void {
    this.tweens.add({ targets: target, ...config });
  }

  private cellCenter(index: number): { x: number; y: number } {
    const column = index % GAME_CONFIG.board.columns;
    const row = Math.floor(index / GAME_CONFIG.board.columns);
    return {
      x: GAME_CONFIG.board.left + column * GAME_CONFIG.board.cellStep + GAME_CONFIG.board.cellSize / 2,
      y: GAME_CONFIG.board.top + row * GAME_CONFIG.board.cellStep + GAME_CONFIG.board.cellSize / 2
    };
  }

  private slotAt(x: number, y: number): number | null {
    for (let index = 0; index < this.board.length; index += 1) {
      const center = this.cellCenter(index);
      if (Math.abs(center.x - x) <= GAME_CONFIG.board.cellSize / 2 && Math.abs(center.y - y) <= GAME_CONFIG.board.cellSize / 2) {
        return index;
      }
    }
    return null;
  }

  private createBoardItem(level: ItemLevel) {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      createdAt: Date.now()
    };
  }

  private definitionColor(level: ItemLevel): number {
    const colors: Record<ItemLevel, number> = {
      1: 0xe9b760,
      2: 0xd66a58,
      3: 0x6f9f93,
      4: 0xdc8660,
      5: 0xe6ae5e,
      6: 0x7b9f86,
      7: 0xc97859
    };
    return colors[level];
  }
}
