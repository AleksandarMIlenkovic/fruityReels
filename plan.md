# Slot Game — Implementation Plan

## Tech Stack
- PixiJS v8
- TypeScript (strict, all variables/parameters/returns explicitly typed)
- Vite

---

## Code Style Rules
- All variables, parameters, and return types must have explicit TypeScript types
- Use `for` loops when the body has side effects (e.g. `addChild`, `push`)
- Use `Array.from` / `map` / `forEach` only for pure transformations with no side effects
- No one-liners that sacrifice readability
- No hacks or workarounds — if something needs a comment to explain why, reconsider the design first

## Assets Available
- Symbol sprites: Cherry, Seven, Bar, Bell, Diamond, Lemon, Plum, Wild
- ReelFrame.png, ReelSeperator.png, SpinButton.png, WinField.png
- Font: PixelifySans-Bold.ttf

---

## File Structure

```
src/
  main.ts                   — entry point, boots Game
  Game.ts                   — creates PixiJS app, loads assets, creates GameScene
  constants.ts              — all named constants with explicit types

  components/
    Symbol.ts               — single symbol display object
    Stripe.ts               — pure data: strip of symbol names + cursor
    Reel.ts                 — clips viewport, owns Stripe + symbol pool, drives animation
    ReelFrame.ts            — decorative frame sprite, no logic
    Reels.ts                — holds all Reel instances + ReelFrame, orchestrates spin/stop

  logic/
    WinEvaluator.ts         — stateless: checks all 5 win lines, returns named WinLine[]
    SpinController.ts       — manages spin lifecycle, emits spinStart / spinEnd
    WinAnimator.ts          — drives the win animation sequence after a spin

  ui/
    SpinButton.ts           — clickable button, emits "spin" event
    WinDisplay.ts           — shows win/loss result text
    BetSelector.ts          — BetField.png sprite + value text in lower panel + < > arrows; getBet()
    PaytableButton.ts       — clickable button, emits "paytable" event
    OutcomeSelector.ts      — HTML dropdown for picking a named outcome

  config/
    Outcome.ts              — Outcome interface (name + grid)
    SymbolValues.ts         — payout value per symbol for 3-of-a-kind

  scenes/
    Scene.ts                — abstract base Container with init() and resize()
    GameScene.ts            — composes all components, handles layout and keyboard
    PaytableScene.ts        — overlay panel showing symbol icons and payout values
```

---

## Constants (`constants.ts`)

```
SYMBOLS          — tuple of all symbol name strings (as const)
SymbolName       — union type derived from SYMBOLS

REEL_COUNT       — 3
ROWS             — 3
SYMBOL_SIZE      — 150 (px, width and height of one symbol)
REEL_SPACING     — 20 (px gap between reels)
SYMBOLS_PER_STRIPE — 20 (how many symbols the data strip holds)

SPIN_SPEED       — pixels per frame the cursor advances while spinning
MIN_SPIN_FRAMES  — minimum frames before a reel is allowed to stop
STOP_DELAY_MS    — stagger delay between each reel stopping (ms)
SYMBOLS_AHEAD    — how many symbols ahead of current cursor to place the landing position
```

---

## Component Design

### Symbol
- Extends `Container`
- Holds one `Sprite` sized to `SYMBOL_SIZE × SYMBOL_SIZE`
- `setSymbol(name: SymbolName): void` — swaps texture (no-op if same name)
- `static randomName(): SymbolName` — returns a random symbol name

---

### Stripe  *(pure data — does NOT extend Container)*
The strip is a fixed-length array of symbol names with a cursor that tracks scroll position in pixels.

**Scroll direction: symbols move TOP → BOTTOM (like a physical slot machine).**
New symbols enter from the top, old symbols exit at the bottom.
This means the cursor DECREASES as the reel spins — we are moving backward through the strip.

**The cursor is the number of pixels that have scrolled past the top of the viewport.**
- `cursor = 0`   → symbol[0] is flush with the top of the viewport
- `cursor = 75`  → symbol[0] is 75 px above the top (partially scrolled off)
- `cursor = 150` → symbol[1] is flush with the top

During spinning: cursor decreases by SPIN_SPEED each frame.
All index lookups use `((cursor % totalHeight) + totalHeight) % totalHeight` to handle negative values.

**State**
- `cells: SymbolName[]` — the data strip (length = SYMBOLS_PER_STRIPE)
- `cursor: number` — current scroll position in pixels; decreases while spinning; never wrapped externally
- `readonly totalHeight: number` — SYMBOLS_PER_STRIPE × SYMBOL_SIZE

**Methods**
- `advance(pixels: number): void` — increments cursor by pixels
- `getVisibleLayout(): Array<{ symbolName: SymbolName; y: number }>` — returns which symbol name appears at which viewport y for the current cursor. Uses `cursor % totalHeight` internally for index lookup.
- `getSymbolAt(row: number): SymbolName` — returns the symbol that is fully visible in the given row
- `placeStopSymbols(targetCursor: number, symbols: SymbolName[]): void` — writes stop symbols into the cells that will be visible when cursor reaches targetCursor

---

### Reel
- Extends `Container`
- Owns one `Stripe` (data) and a pool of `ROWS + 1` Symbol display objects
- Has a `Graphics` clipping mask (SYMBOL_SIZE wide, ROWS × SYMBOL_SIZE tall)
- Each tick: advance cursor → call `getVisibleLayout()` → set each pool symbol's `y` and texture

**Spin state machine**
```
IDLE → spin() → SPINNING → stopAt() → STOPPING → IDLE
```

**SPINNING phase**
- Each tick: `stripe.advance(-SPIN_SPEED)` — cursor decreases, symbols move downward
- Then update symbol pool from layout

**STOPPING phase**
- On first stopping tick: call `prepareStop()`
  - `targetCursor = stripe.cursor - SYMBOLS_AHEAD * SYMBOL_SIZE`, floored to a symbol boundary
  - `targetCursor` is always less than `stripe.cursor` — no wrapping ambiguity
  - Call `stripe.placeStopSymbols(targetCursor, stopSymbols)`
- Each subsequent tick: ease cursor toward targetCursor
  - `remaining = stripe.cursor - targetCursor` (always positive)
  - `stripe.advance(-Math.min(remaining * EASE_FACTOR, SPIN_SPEED))`
  - When `remaining <= 0.5`: snap cursor to targetCursor, call `finishStop()`

**Public API**
- `spin(minFrames: number): void`
- `stopAt(symbols: SymbolName[], onStop: () => void): void`
- `getSymbolAt(row: number): SymbolName`

---

### ReelFrame
- Extends `Container`
- Renders `ReelFrame.png` sized and positioned to surround the reel viewport
- No logic

---

### Reels
- Extends `Container`
- Creates `REEL_COUNT` Reel instances spaced by `SYMBOL_SIZE + REEL_SPACING`
- Creates `REEL_COUNT - 1` separator sprites between reels
- Creates one `ReelFrame` (added first so it draws behind)

**Public API**
- `spinAll(): void` — starts all reels with a per-reel minFrames stagger
- `stopAll(results: SymbolName[][], onAllStopped: () => void): void` — stops each reel with `STOP_DELAY_MS` stagger; calls `onAllStopped` when the last reel stops
- `getResults(): SymbolName[][]` — returns `[reel0Row0..2, reel1Row0..2, reel2Row0..2]`

---

## Win Animation

### Two-phase sequence

**Phase 1 — All lines (2 000 ms)**
All symbols that participate in any winning line pulse together.
WinDisplay shows total win count.

**Phase 2 — Line cycle (1 500 ms per line, loops until next spin)**
Cycles through each winning line one at a time.
Only the three symbols on the current line pulse.
WinDisplay shows the line name (e.g. "TOP ROW", "DIAGONAL ↘") and its symbols.

Between phases and between lines all symbols are reset to scale 1.

### Pulse effect
`scale = 1 + 0.1 * Math.sin(elapsed * PULSE_FREQUENCY)`
Driven by the PixiJS ticker — no external tween library needed.

### WinAnimator (`logic/WinAnimator.ts`)
- Constructed with `Application` and `Reel[]`
- `start(winLines: WinLine[]): void` — begins the two-phase sequence
- `stop(): void` — resets all symbol scales, removes ticker listener
- Internally tracks elapsed time and current phase/line index
- Calls back into `WinDisplay` to update the line label each cycle

### What Reel exposes for animation
`getDisplaySymbol(row: number): Container`
Returns the symbol display object at the given row.
Valid only after the reel has stopped (cursor is snapped to a symbol boundary).

### What WinLine carries
WinLine gains a `name: string` field (e.g. "Top Row", "Diagonal ↘").
The five line definitions live in WinEvaluator alongside the evaluation logic.

---

## Logic

### WinEvaluator
- Stateless utility class
- `static evaluate(results: SymbolName[][]): EvalResult`
- Checks whether center row (index 1) is identical across all reels
- `EvalResult: { win: boolean; line: SymbolName[] }`

### SpinController
- Extends `EventEmitter`
- Emits `"spinStart"` and `"spinEnd"` (with `EvalResult`)
- Reads `?forceWin=true` from URL on construction
- `requestSpin(forced?: boolean): void`
  1. Guard if already spinning
  2. Generate results (win or random non-win)
  3. Call `reels.spinAll()`
  4. After `MIN_STOP_WAIT_MS`: call `reels.stopAll(results, callback)`
  5. In callback: evaluate results, emit `"spinEnd"`

---

## Symbol Payout Values (`config/SymbolValues.ts`)

A record mapping each SymbolName to its 3-of-a-kind win value:

```
Wild    → 500
Seven   → 300
Diamond → 200
Bell    → 150
Bar     → 100
Cherry  →  75
Plum    →  50
Lemon   →  25
```

Wild also substitutes for any symbol on any win line.

---

## PaytableScene

- Extends `Container` — rendered as a full overlay on top of `gameContainer` in `GameScene`
- Dark semi-transparent background (1280×720) blocks interaction with the game beneath
- Centered panel with title, a two-column grid of symbol icon + name + value, and a close button
- Shown when `PaytableButton` is clicked, hidden when close button is clicked
- No scene switching needed — it is simply added/removed as a child of `gameContainer`

---

## Scene

### GameScene
- Extends `Scene`
- Composes: Reels, SpinController, SpinButton, WinDisplay
- `resize(w, h)` — centers Reels, positions SpinButton below, WinDisplay above
- Keyboard shortcut `W` → forced win spin

---

## Spin Flow (end-to-end)

```
User clicks SpinButton
  → SpinButton emits "spin"
  → SpinController.requestSpin()
    → emits "spinStart"   (GameScene: disable button, hide win display)
    → generates results[][]
    → reels.spinAll()
    → setTimeout(MIN_STOP_WAIT_MS)
      → reels.stopAll(results, callback)
        → each reel stops with STOP_DELAY_MS stagger
        → last reel's onStop fires callback
          → WinEvaluator.evaluate(reels.getResults())
          → SpinController emits "spinEnd"  (GameScene: enable button, show result)
```
