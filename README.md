# FruityReels

A browser-based 3×3 slot machine built with PixiJS v8, TypeScript (strict), and Vite.

**Live demo:** https://aleksandarmilenkovic.github.io/fruityReels/

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

Output goes to `dist/`. The build also runs Prettier and TypeScript checks — it will fail if there are formatting or type errors.

---

## How to Play

- Click the **Spin** button or press **W** to spin
- Use the **< >** arrows to change your bet
- Winning symbol combinations are highlighted with a pulse animation
- The **Paytable** button (top right) shows payout values
- The outcome dropdown (top left) lets you force a specific result for testing

---

## Tech Stack

| Tool | Version |
|------|---------|
| PixiJS | v8 |
| TypeScript | strict mode |
| Vite | latest |

---

## Project Structure

```
src/
  main.ts                   — entry point, boots Game
  Game.ts                   — creates PixiJS app, loads assets, creates GameScene
  constants.ts              — all named constants with explicit types

  components/
    Symbol.ts               — single symbol display object (pivot at center)
    Stripe.ts               — pure data: strip of symbol names + scroll cursor
    Reel.ts                 — clips viewport, owns Stripe + symbol pool, spin state machine
    ReelFrame.ts            — decorative frame sprite (anchor 0.5, no logic)
    Reels.ts                — holds all Reel instances, orchestrates spin/stop sequencing
    AnticipationEmitter.ts  — particle effect that fires on near-miss anticipation

  logic/
    WinEvaluator.ts         — stateless: checks 5 win lines, Wild substitution, calculates win amount
    SpinController.ts       — manages spin lifecycle, emits spinStart / spinEnd
    WinAnimator.ts          — drives two-phase pulse animation after a win

  ui/
    SpinButton.ts           — clickable button, emits "spin" event
    WinDisplay.ts           — always-visible win amount panel (shows 0 on loss)
    WinField.ts             — WinField.png sprite + centered value text
    BetSelector.ts          — bet panel with < > arrows, emits "betChange", getBet()
    BetField.ts             — BetField.png sprite + centered value text
    PaytableButton.ts       — clickable button, emits "paytable" event
    OutcomeSelector.ts      — HTML dropdown for picking a named test outcome

  scenes/
    Scene.ts                — abstract base Container with init() and resize()
    GameScene.ts            — composes all components, letterbox resize, keyboard input
    PaytableScene.ts        — overlay panel showing payout table

public/
  assets/                   — sprites, font, audio
  outcomes.json             — named test outcomes loaded by OutcomeSelector
```

---

## Win Lines

Five lines are evaluated on every spin:

| Line | Positions |
|------|-----------|
| Top row | (0,0) (1,0) (2,0) |
| Middle row | (0,1) (1,1) (2,1) |
| Bottom row | (0,2) (1,2) (2,2) |
| Diagonal ↘ | (0,0) (1,1) (2,2) |
| Diagonal ↗ | (0,2) (1,1) (2,0) |

**Wild** substitutes for any symbol on any line.

### Symbol Payouts (3-of-a-kind × bet)

| Symbol | Value |
|--------|-------|
| Wild | 500 |
| Seven | 300 |
| Diamond | 200 |
| Bell | 150 |
| Bar | 100 |
| Cherry | 75 |
| Plum | 50 |
| Lemon | 25 |

---

## Win Animation

After a winning spin, `WinAnimator` runs a two-phase sequence:

1. **All lines (2 s)** — every symbol in any winning line pulses together
2. **Line cycle (1.5 s per line, loops)** — each winning line highlights in turn

Pulse formula: `scale = 1 + 0.1 × |sin(elapsed × frequency)|`

The animation stops automatically when the next spin starts.

---

## Anticipation Effect

When 2 reels have stopped and a partial win is detected, the next reel displays a gold/cyan particle burst (`AnticipationEmitter`) and gets extra stop delay — building tension before the result is revealed.

