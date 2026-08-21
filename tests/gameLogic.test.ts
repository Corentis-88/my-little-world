import { describe, expect, it } from "vitest";
import { createEmptyBoard, canMerge, mergeItems, moveItem, removeItemsForOrder } from "../src/systems/boardSystem";
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
    const restored = deserializeSaveGame(serializeSaveGame(save));
    expect(restored.coins).toBe(125);
    expect(restored.board[4]).toMatchObject({ id: "saved-item", level: 4 });
    expect(restored.discoveries).toEqual([1, 2, 4]);
    expect(restored.orders).toHaveLength(3);
    expect(restored.buildings.drawingStudioStage).toBe(1);
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
