export const SYMBOLS = [
  "Cherry",
  "Seven",
  "Bar",
  "Bell",
  "Diamond",
  "Lemon",
  "Plum",
  "Wild",
] as const;

export type SymbolName = (typeof SYMBOLS)[number];

export const GAME_WIDTH: number = 1280;
export const GAME_HEIGHT: number = 720;

export const REEL_COUNT: number = 3;
export const ROWS: number = 3;
export const SYMBOL_SIZE: number = 130;
export const REEL_SPACING: number = 20;
export const SYMBOLS_PER_STRIPE: number = 20;

export const SPIN_SPEED: number = 30; // pixels advanced per frame while spinning
export const MIN_SPIN_FRAMES: number = 60; // minimum frames before a reel may stop
export const STOP_DELAY_MS: number = 400; // stagger between each reel stopping
export const SYMBOLS_AHEAD: number = 6; // symbols ahead of current cursor to land on

export const BET_VALUES: readonly number[] = [1, 2, 5, 10, 25, 50, 100];
export const DEFAULT_BET_INDEX: number = 3; // starts at 10
