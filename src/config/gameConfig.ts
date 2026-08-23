export const GAME_CONFIG = {
  board: {
    columns: 7,
    rows: 9,
    producerColumn: 3,
    producerRow: 4,
    cellSize: 84,
    cellStep: 90,
    left: 38,
    top: 30,
    width: 700,
    height: 900
  },
  restoration: {
    firstCost: 200
  },
  specialVisit: {
    everyRegularOrders: 5,
    durationMs: 15 * 60 * 1000,
    fallbackCoinsPerSupply: 15
  },
  progression: { levelTwoCoins: 180, levelThreeCoins: 650, masterpieceQuantity: 2 },
  save: {
    version: 3,
    key: "my-little-world-save-v1",
    accessKey: "my-little-world-access"
  },
  responsive: {
    designWidth: 390,
    designHeight: 844
  }
} as const;

export const BOARD_SIZE = GAME_CONFIG.board.columns * GAME_CONFIG.board.rows;
export const PRODUCER_SLOT = GAME_CONFIG.board.producerRow * GAME_CONFIG.board.columns + GAME_CONFIG.board.producerColumn;
