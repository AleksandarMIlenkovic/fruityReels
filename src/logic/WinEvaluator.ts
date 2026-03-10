import { SymbolName } from "../constants";
import { SYMBOL_VALUES } from "../config/SymbolValues";

export interface WinLine {
  name: string;
  positions: [reel: number, row: number][];
  symbols: SymbolName[];
}

export interface EvalResult {
  win: boolean;
  winLines: WinLine[];
}

type Position = [reel: number, row: number];

interface LineDef {
  name: string;
  positions: Position[];
}

const LINE_DEFINITIONS: LineDef[] = [
  {
    name: "Top Row",
    positions: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    name: "Center Row",
    positions: [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    name: "Bottom Row",
    positions: [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    name: "Diagonal ↘",
    positions: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
  },
  {
    name: "Diagonal ↙",
    positions: [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
  },
];

export class WinEvaluator {
  /**
   * Returns true if the first stoppedCount reels form a partial match
   * on any win line — meaning a win is still possible on those reels.
   * Used to trigger anticipation on the next reel.
   */
  public static hasPartialWin(
    results: SymbolName[][],
    stoppedCount: number,
  ): boolean {
    for (const def of LINE_DEFINITIONS) {
      const symbols: SymbolName[] = [];

      for (let i: number = 0; i < stoppedCount; i++) {
        const [reel, row] = def.positions[i];
        symbols.push(results[reel][row]);
      }

      const nonWilds: SymbolName[] = symbols.filter(
        (symbol: SymbolName): boolean => symbol !== "Wild",
      );
      const allWilds: boolean = nonWilds.length === 0;
      const nonWildsMatch: boolean = nonWilds.every(
        (symbol: SymbolName): boolean => symbol === nonWilds[0],
      );

      if (allWilds || nonWildsMatch) return true;
    }

    return false;
  }

  public static evaluate(results: SymbolName[][]): EvalResult {
    const winLines: WinLine[] = [];

    for (const def of LINE_DEFINITIONS) {
      const symbols: SymbolName[] = def.positions.map(
        ([reel, row]: Position): SymbolName => results[reel][row],
      );
      const nonWilds: SymbolName[] = symbols.filter(
        (symbol: SymbolName): boolean => symbol !== "Wild",
      );

      const allWilds: boolean = nonWilds.length === 0;
      const nonWildsMatch: boolean = nonWilds.every(
        (symbol: SymbolName): boolean => symbol === nonWilds[0],
      );

      if (allWilds || nonWildsMatch) {
        winLines.push({ name: def.name, positions: def.positions, symbols });
      }
    }

    return {
      win: winLines.length > 0,
      winLines,
    };
  }

  public static calculateWinAmount(winLines: WinLine[], bet: number): number {
    let total: number = 0;

    for (let i: number = 0; i < winLines.length; i++) {
      const nonWilds: SymbolName[] = winLines[i].symbols.filter(
        (s: SymbolName): boolean => s !== "Wild",
      );
      const symbol: SymbolName = nonWilds.length > 0 ? nonWilds[0] : "Wild";
      total += SYMBOL_VALUES[symbol] * bet;
    }

    return total;
  }
}
