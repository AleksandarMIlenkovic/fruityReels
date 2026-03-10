import { Application, Container, Graphics } from "pixi.js";
import { AnticipationEmitter } from "./AnticipationEmitter";
import {
  ROWS,
  SYMBOL_SIZE,
  SPIN_SPEED,
  MIN_SPIN_FRAMES,
  SYMBOLS_AHEAD,
  SymbolName,
} from "../constants";
import { Symbol } from "./Symbol";
import { Stripe, VisibleCell } from "./Stripe";

type ReelState = "idle" | "spinning" | "stopping";

// Fraction of remaining distance to advance per frame during deceleration.
// Combined with Math.min(..., SPIN_SPEED) this produces a natural slowdown:
// the reel runs at full speed until ~2 symbols from the target, then eases in.
const EASE_FACTOR: number = 0.15;
const SYMBOL_Y_OFFSET: number = 10; // nudge symbols upward within the reel viewport
const MASK_VERTICAL_TRIM: number = 20;

export class Reel extends Container {
  private readonly app: Application;
  private readonly stripe: Stripe;
  private readonly symbolPool: Symbol[];
  private readonly anticipationEmitter: AnticipationEmitter;

  private state: ReelState = "idle";
  private frameCount: number = 0;
  private minFrames: number = MIN_SPIN_FRAMES;

  private targetCursor: number = 0;
  private targetPrepared: boolean = false;
  private stopSymbols: SymbolName[] | null = null;
  private onStopCallback: (() => void) | null = null;

  constructor(app: Application) {
    super();
    this.app = app;

    this.stripe = new Stripe();

    // Pool size is ROWS + 1 to accommodate one partially-visible symbol
    // at the top when the cursor is not aligned to a symbol boundary.
    this.symbolPool = [];
    for (let i: number = 0; i < ROWS + 1; i++) {
      const symbol: Symbol = new Symbol(Symbol.randomName());
      symbol.x = SYMBOL_SIZE / 2;
      this.symbolPool.push(symbol);
      this.addChild(symbol);
    }

    const mask: Graphics = new Graphics()
      .rect(0, 0, SYMBOL_SIZE, ROWS * SYMBOL_SIZE - MASK_VERTICAL_TRIM)
      .fill(0xffffff);
    this.addChild(mask);
    this.mask = mask;

    this.anticipationEmitter = new AnticipationEmitter(this.app);
    this.addChild(this.anticipationEmitter);

    this.applyLayout();
  }

  public get reelWidth(): number {
    return SYMBOL_SIZE;
  }

  public getSymbolAt(row: number): SymbolName {
    return this.stripe.getSymbolAt(row);
  }

  /**
   * Returns the display object for the symbol visible in the given row.
   * Only valid after the reel has stopped (cursor snapped to symbol boundary).
   */
  public getDisplaySymbol(row: number): Container {
    return this.symbolPool[row];
  }

  public spin(minFrames: number = MIN_SPIN_FRAMES): void {
    this.state = "spinning";
    this.frameCount = 0;
    this.minFrames = minFrames;
    this.stopSymbols = null;
    this.onStopCallback = null;
    this.targetPrepared = false;
    this.app.ticker.add(this.onTick, this);
  }

  public stopAt(symbols: SymbolName[], onStop: () => void): void {
    if (this.state !== "spinning") return;
    this.stopSymbols = symbols;
    this.onStopCallback = onStop;
    this.state = "stopping";
  }

  public startAnticipation(): void {
    this.anticipationEmitter.start();
  }

  public stopAnticipation(): void {
    this.anticipationEmitter.stop();
  }

  private onTick = (): void => {
    this.frameCount++;

    if (this.state === "spinning" || this.frameCount < this.minFrames) {
      this.stripe.advance(-SPIN_SPEED);
      this.applyLayout();
      return;
    }

    // STOPPING — prepare the landing position on the first eligible frame
    if (!this.targetPrepared) {
      this.prepareStop();
      this.targetPrepared = true;
    }

    // remaining is always positive: cursor is above targetCursor and moving toward it
    const remaining: number = this.stripe.cursor - this.targetCursor;

    if (remaining <= 0.5) {
      this.stripe.cursor = this.targetCursor;
      this.applyLayout();
      this.finishStop();
    } else {
      this.stripe.advance(-Math.min(remaining * EASE_FACTOR, SPIN_SPEED));
      this.applyLayout();
    }
  };

  private prepareStop(): void {
    // targetCursor is always < stripe.cursor so remaining is never negative.
    // Floor to a symbol boundary so the reel lands cleanly with no sub-pixel offset.
    const rawTarget: number = this.stripe.cursor - SYMBOLS_AHEAD * SYMBOL_SIZE;
    this.targetCursor = Math.floor(rawTarget / SYMBOL_SIZE) * SYMBOL_SIZE;

    this.stripe.placeStopSymbols(this.targetCursor, this.stopSymbols!);
    this.stopSymbols = null;
  }

  private applyLayout(): void {
    const layout: VisibleCell[] = this.stripe.getVisibleLayout();

    for (let i: number = 0; i < layout.length; i++) {
      const symbol: Symbol = this.symbolPool[i];
      symbol.visible = true;
      symbol.y = layout[i].y + SYMBOL_SIZE / 2 - SYMBOL_Y_OFFSET;
      symbol.setSymbol(layout[i].symbolName);
    }

    for (let i: number = layout.length; i < this.symbolPool.length; i++) {
      this.symbolPool[i].visible = false;
    }
  }

  private finishStop(): void {
    this.stopAnticipation();
    this.state = "idle";
    this.targetPrepared = false;
    this.app.ticker.remove(this.onTick, this);
    this.onStopCallback?.();
    this.onStopCallback = null;
  }
}
