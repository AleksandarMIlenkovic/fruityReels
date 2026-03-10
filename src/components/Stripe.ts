import { SYMBOL_SIZE, SYMBOLS_PER_STRIPE, ROWS, SymbolName } from "../constants";
import { Symbol } from "./Symbol";

export interface VisibleCell {
  symbolName: SymbolName;
  y: number;
}

/**
 * Stripe is pure data — no display logic.
 *
 * It holds a fixed-length array of symbol names and a cursor that represents
 * how many pixels of the strip have scrolled past the top of the viewport.
 *
 *   cursor = 0   → symbol[0] flush with top of viewport
 *   cursor = 75  → symbol[0] is 75px above the top (partially scrolled off)
 *   cursor = 150 → symbol[1] flush with top of viewport
 *
 * The cursor grows continuously (never wrapped externally) so that stop logic
 * can always compute a targetCursor > cursor with no ambiguity.
 * Index lookups use cursor % totalHeight internally.
 */
export class Stripe {
  private readonly cells: SymbolName[];
  public readonly totalHeight: number;
  public cursor: number;

  constructor() {
    this.totalHeight = SYMBOLS_PER_STRIPE * SYMBOL_SIZE;
    this.cursor = 0;
    this.cells = [];
    for (let i: number = 0; i < SYMBOLS_PER_STRIPE; i++) {
      this.cells.push(Symbol.randomName());
    }
  }

  public advance(pixels: number): void {
    this.cursor += pixels;
  }

  /**
   * Returns the layout of symbols currently visible in the viewport.
   * The first entry may have a negative y (partially above the top edge).
   * Returns ROWS entries when aligned to a symbol boundary, ROWS+1 otherwise.
   */
  public getVisibleLayout(): VisibleCell[] {
    const wrappedCursor: number =
      ((this.cursor % this.totalHeight) + this.totalHeight) % this.totalHeight;

    const topIndex: number = Math.floor(wrappedCursor / SYMBOL_SIZE);
    const offset: number = wrappedCursor % SYMBOL_SIZE;
    const count: number = Math.ceil((ROWS * SYMBOL_SIZE + offset) / SYMBOL_SIZE);

    const layout: VisibleCell[] = [];
    for (let i: number = 0; i < count; i++) {
      layout.push({
        symbolName: this.cells[(topIndex + i) % SYMBOLS_PER_STRIPE],
        y: i * SYMBOL_SIZE - offset,
      });
    }
    return layout;
  }

  /**
   * Returns the symbol name fully visible in the given row (0 = top).
   * Meaningful only when the cursor is snapped to a symbol boundary.
   */
  public getSymbolAt(row: number): SymbolName {
    const wrappedCursor: number =
      ((this.cursor % this.totalHeight) + this.totalHeight) % this.totalHeight;
    const topIndex: number = Math.floor(wrappedCursor / SYMBOL_SIZE);
    return this.cells[(topIndex + row) % SYMBOLS_PER_STRIPE];
  }

  /**
   * Writes stopSymbols into the cells that will be visible when the cursor
   * reaches targetCursor. Fills all other cells with random symbols.
   * targetCursor must be a multiple of SYMBOL_SIZE.
   */
  public placeStopSymbols(targetCursor: number, stopSymbols: SymbolName[]): void {
    // Use positive modulo — targetCursor may be negative when the cursor has been decreasing.
    const rawIndex: number = Math.floor(targetCursor / SYMBOL_SIZE) % SYMBOLS_PER_STRIPE;
    const topIndex: number = (rawIndex + SYMBOLS_PER_STRIPE) % SYMBOLS_PER_STRIPE;

    for (let row: number = 0; row < stopSymbols.length; row++) {
      this.cells[(topIndex + row) % SYMBOLS_PER_STRIPE] = stopSymbols[row];
    }

    for (let i: number = 0; i < SYMBOLS_PER_STRIPE; i++) {
      const distanceFromTop: number = (i - topIndex + SYMBOLS_PER_STRIPE) % SYMBOLS_PER_STRIPE;
      if (distanceFromTop >= stopSymbols.length) {
        this.cells[i] = Symbol.randomName();
      }
    }
  }
}
