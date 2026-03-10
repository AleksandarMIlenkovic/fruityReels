import { Application, Container, Sprite, Texture } from "pixi.js";
import {
  REEL_COUNT,
  ROWS,
  SYMBOL_SIZE,
  REEL_SPACING,
  STOP_DELAY_MS,
  SymbolName,
} from "../constants";
import { Reel } from "./Reel";
import { ReelFrame } from "./ReelFrame";
import { WinEvaluator } from "../logic/WinEvaluator";

const REELS_WIDTH: number =
  REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING;
const REELS_HEIGHT: number = ROWS * SYMBOL_SIZE;

const ANTICIPATION_EXTRA_DELAY_MS: number = 1200;
const SEPARATOR_VERTICAL_TRIM: number = 20;

/**
 * Reels holds all individual Reel instances and the decorative ReelFrame.
 * It orchestrates spin and stop sequencing across all reels.
 */
export class Reels extends Container {
  private readonly reels: Reel[];

  constructor(app: Application) {
    super();
    this.pivot.set(REELS_WIDTH / 2, REELS_HEIGHT / 2);

    const reelFrame: ReelFrame = new ReelFrame();
    reelFrame.x = REELS_WIDTH / 2;
    reelFrame.y = REELS_HEIGHT / 2;
    this.addChild(reelFrame);

    this.reels = [];
    for (let i: number = 0; i < REEL_COUNT; i++) {
      const reel: Reel = new Reel(app);
      reel.x = i * (SYMBOL_SIZE + REEL_SPACING);
      this.reels.push(reel);
      this.addChild(reel);
    }

    for (let i: number = 0; i < REEL_COUNT - 1; i++) {
      const separator: Sprite = new Sprite(
        Texture.from("/assets/ReelSeperator.png"),
      );
      separator.x = (i + 1) * (SYMBOL_SIZE + REEL_SPACING) - REEL_SPACING;
      separator.y = 0;
      separator.width = REEL_SPACING;
      separator.height = ROWS * SYMBOL_SIZE - SEPARATOR_VERTICAL_TRIM;
      this.addChild(separator);
    }
  }

  public getReels(): Reel[] {
    return this.reels;
  }

  public spinAll(): void {
    for (let i: number = 0; i < this.reels.length; i++) {
      this.reels[i].spin(60 + i * 20);
    }
  }

  public stopAll(results: SymbolName[][], onAllStopped: () => void): void {
    let stoppedCount: number = 0;
    let accumulatedDelay: number = 0;

    for (let i: number = 0; i < this.reels.length; i++) {
      const reel: Reel = this.reels[i];
      accumulatedDelay += STOP_DELAY_MS;

      const stopIndex: number = i;

      setTimeout((): void => {
        reel.stopAt(results[stopIndex], (): void => {
          stoppedCount++;

          if (stoppedCount === REEL_COUNT) {
            onAllStopped();
            return;
          }

          // Anticipation only makes sense once at least 2 reels have stopped —
          // that's when there's a meaningful partial match to react to.
          if (stoppedCount >= 2) {
            const nextReel: Reel = this.reels[stoppedCount];
            if (WinEvaluator.hasPartialWin(results, stoppedCount)) {
              nextReel.startAnticipation();
            }
          }
        });
      }, accumulatedDelay);

      // If the next reel will be in anticipation, give it extra time before stopping.
      // We don't know yet whether anticipation will trigger, so we check the results
      // ahead of time to pre-calculate the delay.
      const nextReelIndex: number = i + 1;
      if (
        nextReelIndex < REEL_COUNT &&
        nextReelIndex >= 2 &&
        WinEvaluator.hasPartialWin(results, i + 1)
      ) {
        accumulatedDelay += ANTICIPATION_EXTRA_DELAY_MS;
      }
    }
  }

  public getResults(): SymbolName[][] {
    const results: SymbolName[][] = [];

    for (const reel of this.reels) {
      const column: SymbolName[] = [];
      for (let row: number = 0; row < ROWS; row++) {
        column.push(reel.getSymbolAt(row));
      }
      results.push(column);
    }

    return results;
  }
}
