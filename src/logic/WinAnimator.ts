import { Application, Container } from "pixi.js";
import { Reel } from "../components/Reel";
import { WinLine } from "./WinEvaluator";
import { WinDisplay } from "../ui/WinDisplay";

const PULSE_FREQUENCY: number = 5;    // oscillations per second
const PULSE_AMPLITUDE: number = 0.1;  // scale added on top of 1.0
const ALL_LINES_DURATION_MS: number = 2000;
const PER_LINE_DURATION_MS: number = 1500;

type Phase = "all-lines" | "line-cycle";

export class WinAnimator {
  private readonly app: Application;
  private readonly reels: Reel[];
  private readonly winDisplay: WinDisplay;

  private winLines: WinLine[] = [];
  private phase: Phase = "all-lines";
  private elapsedMs: number = 0;
  private currentLineIndex: number = 0;
  private running: boolean = false;

  constructor(app: Application, reels: Reel[], winDisplay: WinDisplay) {
    this.app = app;
    this.reels = reels;
    this.winDisplay = winDisplay;
  }

  public start(winLines: WinLine[]): void {
    this.winLines = winLines;
    this.phase = "all-lines";
    this.elapsedMs = 0;
    this.currentLineIndex = 0;
    this.running = true;

    this.app.ticker.add(this.onTick, this);
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.app.ticker.remove(this.onTick, this);
    this.resetAllSymbols();
  }

  private onTick = (ticker: { deltaMS: number }): void => {
    this.elapsedMs += ticker.deltaMS;

    if (this.phase === "all-lines") {
      this.tickAllLines();
    } else {
      this.tickLineCycle();
    }
  };

  private tickAllLines(): void {
    if (this.elapsedMs >= ALL_LINES_DURATION_MS) {
      this.resetAllSymbols();
      this.phase = "line-cycle";
      this.elapsedMs = 0;
      this.currentLineIndex = 0;
      return;
    }

    const scale: number = this.pulseScale(this.elapsedMs);
    const symbols: Container[] = this.collectAllWinningSymbols();
    for (let i: number = 0; i < symbols.length; i++) {
      symbols[i].scale.set(scale);
    }
  }

  private tickLineCycle(): void {
    if (this.elapsedMs >= PER_LINE_DURATION_MS) {
      this.resetAllSymbols();
      this.currentLineIndex = (this.currentLineIndex + 1) % this.winLines.length;
      this.elapsedMs = 0;
      return;
    }

    const scale: number = this.pulseScale(this.elapsedMs);
    const symbols: Container[] = this.collectLineSymbols(this.winLines[this.currentLineIndex]);
    for (let i: number = 0; i < symbols.length; i++) {
      symbols[i].scale.set(scale);
    }
  }

  private pulseScale(elapsedMs: number): number {
    const elapsedSeconds: number = elapsedMs / 1000;
    return 1 + PULSE_AMPLITUDE * Math.abs(Math.sin(elapsedSeconds * PULSE_FREQUENCY));
  }

  private collectAllWinningSymbols(): Container[] {
    const seen: Set<string> = new Set();
    const symbols: Container[] = [];

    for (let i: number = 0; i < this.winLines.length; i++) {
      const positions: [reel: number, row: number][] = this.winLines[i].positions;
      for (let j: number = 0; j < positions.length; j++) {
        const reel: number = positions[j][0];
        const row: number = positions[j][1];
        const key: string = `${reel},${row}`;
        if (!seen.has(key)) {
          seen.add(key);
          symbols.push(this.reels[reel].getDisplaySymbol(row));
        }
      }
    }

    return symbols;
  }

  private collectLineSymbols(line: WinLine): Container[] {
    const symbols: Container[] = [];
    for (let i: number = 0; i < line.positions.length; i++) {
      const reel: number = line.positions[i][0];
      const row: number = line.positions[i][1];
      symbols.push(this.reels[reel].getDisplaySymbol(row));
    }
    return symbols;
  }

  private resetAllSymbols(): void {
    const symbols: Container[] = this.collectAllWinningSymbols();
    for (let i: number = 0; i < symbols.length; i++) {
      symbols[i].scale.set(1);
    }
  }
}
