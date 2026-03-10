import { Application, Container, Graphics } from "pixi.js";

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

const SPAWN_RATE: number = 3;
const MIN_SPEED: number = 0.5;
const MAX_SPEED: number = 2.5;
const MIN_SIZE: number = 2;
const MAX_SIZE: number = 5;
const MIN_AGE_MS: number = 400;
const MAX_AGE_MS: number = 900;
const COLORS: number[] = [0xffd700, 0xffffff, 0xffee88, 0xffaa00];

/**
 * SparkleEmitter spawns glowing particles along the border of the reel frame.
 * Each particle flies outward, fades, and dies.
 * Call start() on win, stop() when the next spin begins.
 */
export class SparkleEmitter extends Container {
  private readonly app: Application;
  private readonly graphics: Graphics;
  private readonly particles: Particle[];

  private readonly frameLeft: number;
  private readonly frameTop: number;
  private readonly frameRight: number;
  private readonly frameBottom: number;

  private running: boolean = false;

  constructor(
    app: Application,
    frameLeft: number,
    frameTop: number,
    frameRight: number,
    frameBottom: number,
  ) {
    super();
    this.app = app;
    this.frameLeft = frameLeft;
    this.frameTop = frameTop;
    this.frameRight = frameRight;
    this.frameBottom = frameBottom;

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

    for (const p of this.particles) {
      const progress: number = p.age / p.maxAge;
      const alpha: number = 1 - progress;
      const radius: number = p.size * (1 - progress * 0.5);

      this.graphics.circle(p.x, p.y, radius);
      this.graphics.fill({ color: p.color, alpha });
    }
  }

  private spawnParticle(): Particle {
    const { x, y, nx, ny } = this.randomBorderPoint();

    const speed: number = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    const spread: number = (Math.random() - 0.5) * 2;

    // Outward velocity along the normal, with perpendicular spread
    const vx: number = nx * speed + (-ny) * spread;
    const vy: number = ny * speed + nx * spread;

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
    const width: number = this.frameRight - this.frameLeft;
    const height: number = this.frameBottom - this.frameTop;
    const perimeter: number = 2 * (width + height);
    const t: number = Math.random() * perimeter;

    if (t < width) {
      // Top edge — shoots upward
      return { x: this.frameLeft + t, y: this.frameTop, nx: 0, ny: -1 };
    }

    if (t < width + height) {
      // Right edge — shoots right
      return { x: this.frameRight, y: this.frameTop + (t - width), nx: 1, ny: 0 };
    }

    if (t < 2 * width + height) {
      // Bottom edge — shoots downward
      return { x: this.frameRight - (t - width - height), y: this.frameBottom, nx: 0, ny: 1 };
    }

    // Left edge — shoots left
    return { x: this.frameLeft, y: this.frameBottom - (t - 2 * width - height), nx: -1, ny: 0 };
  }
}
