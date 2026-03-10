import { Container, Sprite, Texture } from "pixi.js";
import { REEL_COUNT, ROWS, SYMBOL_SIZE, REEL_SPACING } from "../constants";

// Extra pixels added to each side so the frame border visually wraps the reels
const BORDER: number = 50;

export class ReelFrame extends Container {
  constructor() {
    super();

    const totalWidth: number =
      REEL_COUNT * SYMBOL_SIZE + (REEL_COUNT - 1) * REEL_SPACING;
    const totalHeight: number = ROWS * SYMBOL_SIZE;

    const frame: Sprite = new Sprite(Texture.from("ReelFrame"));
    frame.anchor.set(0.5);
    frame.width = totalWidth + BORDER * 2;
    frame.height = totalHeight + BORDER * 2;
    this.addChild(frame);
  }
}
