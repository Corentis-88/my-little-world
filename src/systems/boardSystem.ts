import { BOARD_SIZE, PRODUCER_SLOT } from "../config/gameConfig";
import type { BoardItem, BoardState, ItemLevel } from "../types/game";

export function createEmptyBoard(): BoardState {
  return Array.from({ length: BOARD_SIZE }, () => null);
}

export function cloneBoard(board: BoardState): BoardState {
  return board.map((item) => (item ? { ...item } : null));
}

export function nextItemLevel(level: ItemLevel): ItemLevel | null {
  return level >= 7 ? null : ((level + 1) as ItemLevel);
}

export function canMerge(first: BoardItem | null, second: BoardItem | null): boolean {
  return Boolean(first && second && first.level === second.level && first.level < 7);
}

export function findFreeSlots(board: BoardState): number[] {
  const slots: number[] = [];
  for (let index = 0; index < board.length; index += 1) {
    if (index !== PRODUCER_SLOT && board[index] === null) {
      slots.push(index);
    }
  }
  return slots;
}

export function findFirstItemAtLevel(board: BoardState, level: ItemLevel): number | null {
  const index = board.findIndex((item, slot) => slot !== PRODUCER_SLOT && item?.level === level);
  return index === -1 ? null : index;
}

export function countItemsAtLevel(board: BoardState, level: ItemLevel): number {
  return board.reduce((count, item, index) => count + (index !== PRODUCER_SLOT && item?.level === level ? 1 : 0), 0);
}

export function moveItem(board: BoardState, from: number, to: number): BoardState | null {
  if (!isUsableSlot(board, from) || !isUsableSlot(board, to) || board[from] === null || board[to] !== null) {
    return null;
  }
  const next = cloneBoard(board);
  const item = next[from];
  if (!item) {
    return null;
  }
  next[to] = item;
  next[from] = null;
  return next;
}

export function mergeItems(
  board: BoardState,
  from: number,
  to: number,
  createMergedItem: (level: ItemLevel) => BoardItem
): { board: BoardState; resultLevel: ItemLevel } | null {
  if (!isUsableSlot(board, from) || !isUsableSlot(board, to) || !canMerge(board[from] ?? null, board[to] ?? null)) {
    return null;
  }
  const source = board[from];
  const target = board[to];
  if (!source || !target) {
    return null;
  }
  const resultLevel = nextItemLevel(source.level);
  if (!resultLevel) {
    return null;
  }
  const next = cloneBoard(board);
  next[from] = null;
  next[to] = createMergedItem(resultLevel);
  return { board: next, resultLevel };
}

export function removeItemsForOrder(board: BoardState, level: ItemLevel, quantity: number): { board: BoardState; removed: number[] } | null {
  const available = board
    .map((item, index) => (index !== PRODUCER_SLOT && item?.level === level ? index : -1))
    .filter((index) => index >= 0);
  if (available.length < quantity) {
    return null;
  }
  const removed = available.slice(0, quantity);
  const next = cloneBoard(board);
  removed.forEach((index) => {
    next[index] = null;
  });
  return { board: next, removed };
}

export function produceItem(
  board: BoardState,
  random: () => number,
  createItem: (level: ItemLevel) => BoardItem
): { board: BoardState; slot: number; level: ItemLevel } | null {
  const freeSlots = findFreeSlots(board);
  const slot = freeSlots[0];
  if (slot === undefined) {
    return null;
  }
  const level: ItemLevel = random() < 0.2 ? 2 : 1;
  const next = cloneBoard(board);
  next[slot] = createItem(level);
  return { board: next, slot, level };
}

function isUsableSlot(board: BoardState, index: number): boolean {
  return index >= 0 && index < board.length && index !== PRODUCER_SLOT && index < BOARD_SIZE;
}
