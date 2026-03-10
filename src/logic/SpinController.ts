import { EventEmitter } from "pixi.js";
import { REEL_COUNT, ROWS, SymbolName } from "../constants";
import { Reels } from "../components/Reels";
import { WinEvaluator, EvalResult } from "./WinEvaluator";
import { Symbol } from "../components/Symbol";
import { Outcome } from "../config/Outcome";

const MIN_STOP_WAIT_MS: number = 800;

export class SpinController extends EventEmitter {
  private readonly reels: Reels;
  private spinning: boolean = false;

  constructor(reels: Reels) {
    super();
    this.reels = reels;
  }

  public get isSpinning(): boolean {
    return this.spinning;
  }

  public requestSpin(outcome: Outcome | null = null): void {
    if (this.spinning) return;
    this.spinning = true;
    this.emit("spinStart");

    const results: SymbolName[][] =
      outcome !== null ? outcome.grid : this.generateRandomResults();
    this.reels.spinAll();

    setTimeout((): void => {
      this.reels.stopAll(results, (): void => {
        this.spinning = false;
        const evalResult: EvalResult = WinEvaluator.evaluate(
          this.reels.getResults(),
        );
        this.emit("spinEnd", evalResult);
      });
    }, MIN_STOP_WAIT_MS);
  }

  private generateRandomResults(): SymbolName[][] {
    let results: SymbolName[][];
    do {
      results = [];
      for (let i: number = 0; i < REEL_COUNT; i++) {
        const column: SymbolName[] = [];
        for (let row: number = 0; row < ROWS; row++) {
          column.push(Symbol.randomName());
        }
        results.push(column);
      }
    } while (WinEvaluator.evaluate(results).win);

    return results;
  }
}
