import { Container, Sprite, Text, Texture } from "pixi.js";

// Vertical offset from sprite center down into the lower dark panel
const VALUE_Y_OFFSET: number = 10;

export class BetField extends Container {
  private readonly bg: Sprite;
  private readonly valueText: Text;

  constructor() {
    super();

    this.bg = new Sprite(Texture.from("/assets/BetField.png"));
    this.bg.anchor.set(0.5);
    this.bg.scale.set(0.5, 0.5);
    this.addChild(this.bg);

    this.valueText = new Text({
      text: "",
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 32,
        fill: 0xffd700,
        align: "center",
      },
    });
    this.valueText.anchor.set(0.5);
    this.valueText.y = VALUE_Y_OFFSET;
    this.addChild(this.valueText);
  }

  public setText(value: string): void {
    this.valueText.text = value;
  }
}
