import { Application, Container, Graphics } from "pixi.js";
import { ROWS, SYMBOL_SIZE } from "../constants";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: number;
  age: number;
  maxAge: number;
}

const SPAWN_RATE: number = 5;
const MIN_SPEED: number = 1.5;
const MAX_SPEED: number = 4;
const MIN_SIZE: number = 2;
const MAX_SIZE: number = 5;
const MIN_AGE_MS: number = 250;
const MAX_AGE_MS: number = 600;
const COLORS: number[] = [0xffd700, 0xffee88, 0x00e5ff, 0xffffff];
const SPREAD_FACTOR: number = 1.5;
const RADIUS_DECAY: number = 0.5;

// Must match the mask height in Reel.ts
const MASK_VERTICAL_TRIM: number = 20;
const REEL_HEIGHT: number = ROWS * SYMBOL_SIZE - MASK_VERTICAL_TRIM;

export class AnticipationEmitter extends Container {
  private readonly app: Application;
  private readonly graphics: Graphics;
  private readonly particles: Particle[];
  private running: boolean = false;

  constructor(app: Application) {
    super();
    this.app = app;
    this.particles = [];
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.app.ticker.add(this.onTick, this);
  }

  public stop(): void {
    if (!this.running) return;
    this.running = false;
    this.app.ticker.remove(this.onTick, this);
    this.particles.length = 0;
    this.graphics.clear();
  }

  private onTick = (ticker: { deltaMS: number }): void => {
    for (let i: number = 0; i < SPAWN_RATE; i++) {
      this.particles.push(this.spawnParticle());
    }

    for (let i: number = this.particles.length - 1; i >= 0; i--) {
      const p: Particle = this.particles[i];
      p.age += ticker.deltaMS;

      if (p.age >= p.maxAge) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
    }

    this.redraw();
  };

  private redraw(): void {
    this.graphics.clear();

    for (let i: number = 0; i < this.particles.length; i++) {
      const p: Particle = this.particles[i];
      const progress: number = p.age / p.maxAge;
      const alpha: number = 1 - progress;
      const radius: number = p.size * (1 - progress * RADIUS_DECAY);

      this.graphics.circle(p.x, p.y, radius);
      this.graphics.fill({ color: p.color, alpha });
    }
  }

  private spawnParticle(): Particle {
    const { x, y, nx, ny } = this.randomBorderPoint();

    const speed: number = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    const spread: number = (Math.random() - 0.5) * SPREAD_FACTOR;

    // Shoot inward (negate the outward normal) with slight perpendicular spread
    const vx: number = -nx * speed + (-ny) * spread;
    const vy: number = -ny * speed + nx * spread;

    return {
      x,
      y,
      vx,
      vy,
      size: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      age: 0,
      maxAge: MIN_AGE_MS + Math.random() * (MAX_AGE_MS - MIN_AGE_MS),
    };
  }

  private randomBorderPoint(): { x: number; y: number; nx: number; ny: number } {
    const w: number = SYMBOL_SIZE;
    const h: number = REEL_HEIGHT;
    const perimeter: number = 2 * (w + h);
    const t: number = Math.random() * perimeter;

    if (t < w) {
      return { x: t, y: 0, nx: 0, ny: -1 };
    }

    if (t < w + h) {
      return { x: w, y: t - w, nx: 1, ny: 0 };
    }

    if (t < 2 * w + h) {
      return { x: w - (t - w - h), y: h, nx: 0, ny: 1 };
    }

    return { x: 0, y: h - (t - 2 * w - h), nx: -1, ny: 0 };
  }
}
