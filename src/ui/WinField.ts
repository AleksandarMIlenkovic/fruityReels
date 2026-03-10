import { Container, Sprite, Text, Texture } from "pixi.js";

// Vertical offset from sprite center down into the lower dark panel
const VALUE_Y_OFFSET: number = 28;
const COUNT_UP_DURATION_MS: number = 800;

export class WinField extends Container {
  private readonly bg: Sprite;
  private readonly valueText: Text;
  private rafId: number = 0;

  constructor() {
    super();

    this.bg = new Sprite(Texture.from("WinField"));
    this.bg.anchor.set(0.5);
    this.addChild(this.bg);

    this.valueText = new Text({
      text: "",
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 60,
        fill: 0xffd700,
        align: "center",
      },
    });
    this.valueText.anchor.set(0.5);
    this.valueText.y = VALUE_Y_OFFSET;
    this.addChild(this.valueText);
  }

  public setText(value: string): void {
    this.cancelCountUp();
    this.valueText.text = value;
  }

  public countUp(target: number): void {
    this.cancelCountUp();

    if (target === 0) {
      this.valueText.text = "0";
      return;
    }

    const startTime: number = performance.now();

    const tick = (now: number): void => {
      const elapsed: number = now - startTime;
      const progress: number = Math.min(elapsed / COUNT_UP_DURATION_MS, 1);
      const eased: number = 1 - Math.pow(1 - progress, 3);
      this.valueText.text = String(Math.floor(eased * target));

      if (progress < 1) {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private cancelCountUp(): void {
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }
}
