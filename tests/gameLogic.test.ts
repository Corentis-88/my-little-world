import { describe, expect, it } from "vitest";
import { addItemsToBoard, createEmptyBoard, canMerge, mergeItems, moveItem, removeItemsForOrder } from "../src/systems/boardSystem";
import { createSpecialOrder } from "../src/data/orderData";
import { createDefaultSaveGame, deserializeSaveGame, serializeSaveGame } from "../src/systems/saveSystem";
import type { BoardItem } from "../src/types/game";

const item = (level: BoardItem["level"], id = `test-${level}`): BoardItem => ({ id, level, createdAt: 1 });

describe("merge board rules", () => {
  it("only allows two matching non-max items to merge", () => {
    expect(canMerge(item(1), item(1))).toBe(true);
    expect(canMerge(item(1), item(2))).toBe(false);
    expect(canMerge(item(7), item(7))).toBe(false);
  });

  it("creates the next level without losing the other board slots", () => {
    const board = createEmptyBoard();
    board[0] = item(2, "a");
    board[1] = item(2, "b");
    board[8] = item(5, "keep");
    const merged = mergeItems(board, 0, 1, (level) => item(level, "merged"));
    expect(merged?.resultLevel).toBe(3);
    expect(merged?.board[0]).toBeNull();
    expect(merged?.board[1]?.level).toBe(3);
    expect(merged?.board[8]?.id).toBe("keep");
  });

  it("moves an item only into an empty usable slot", () => {
    const board = createEmptyBoard();
    board[2] = item(1);
    expect(moveItem(board, 2, 3)?.[3]?.level).toBe(1);
    expect(moveItem(board, 2, 3)?.[2]).toBeNull();
    expect(moveItem(board, 2, 2)).toBeNull();
  });
});

describe("save serialization", () => {
  it("round-trips board, discoveries, coins, orders, and building progress", () => {
    const save = createDefaultSaveGame();
    save.coins = 125;
    save.board[4] = item(4, "saved-item");
    save.discoveries = [1, 2, 4];
    save.buildings.drawingStudioStage = 1;
    save.regularOrdersCompleted = 5;
    save.specialOrder = createSpecialOrder(0, false, 1_000);
    const restored = deserializeSaveGame(serializeSaveGame(save));
    expect(restored.coins).toBe(125);
    expect(restored.board[4]).toMatchObject({ id: "saved-item", level: 4 });
    expect(restored.discoveries).toEqual([1, 2, 4]);
    expect(restored.orders).toHaveLength(3);
    expect(restored.buildings.drawingStudioStage).toBe(1);
    expect(restored.regularOrdersCompleted).toBe(5);
    expect(restored.specialOrder).toMatchObject({ visitor: "margo", requestedLevel: 5, expiresAt: 901_000 });
  });
});

describe("special visiting requests", () => {
  it("creates a time-limited, escalating request with coins and supplies", () => {
    const first = createSpecialOrder(0, false, 1_000);
    const restored = createSpecialOrder(1, true, 1_000);
    expect(first).toMatchObject({ requestedLevel: 5, coinReward: 140, bonusItemLevels: [2, 2, 3], expiresAt: 901_000 });
    expect(restored).toMatchObject({ requestedLevel: 6, coinReward: 240, bonusItemLevels: [3, 3, 4] });
  });

  it("adds reward supplies without overwriting the producer or a full board", () => {
    const board = createEmptyBoard();
    board[0] = item(1, "existing");
    const rewarded = addItemsToBoard(board, [2, 3], (level) => item(level, `gift-${level}`));
    expect(rewarded.placed).toEqual([2, 3]);
    expect(rewarded.board[0]?.id).toBe("existing");
    expect(rewarded.board[31]).toBeNull();
    const full = createEmptyBoard().map((_, index) => (index === 31 ? null : item(1, `full-${index}`)));
    const overflow = addItemsToBoard(full, [2], (level) => item(level, "overflow"));
    expect(overflow.placed).toEqual([]);
    expect(overflow.unplaced).toEqual([2]);
  });
});

describe("order fulfilment", () => {
  it("removes the requested item only when it is available", () => {
    const board = createEmptyBoard();
    board[0] = item(3, "requested");
    board[1] = item(1, "safe");
    expect(removeItemsForOrder(board, 4, 1)).toBeNull();
    const fulfilled = removeItemsForOrder(board, 3, 1);
    expect(fulfilled?.removed).toEqual([0]);
    expect(fulfilled?.board[0]).toBeNull();
    expect(fulfilled?.board[1]?.id).toBe("safe");
  });
});
