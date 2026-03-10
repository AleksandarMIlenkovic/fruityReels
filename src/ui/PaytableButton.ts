import { Container, Graphics, Text } from "pixi.js";

export class PaytableButton extends Container {
  constructor() {
    super();

    const bg: Graphics = new Graphics()
      .roundRect(0, 0, 40, 40, 8)
      .fill(0x2a0a4e)
      .stroke({ color: 0xffd700, width: 1 });
    this.addChild(bg);

    const label: Text = new Text({
      text: "i",
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 30,
        fill: 0xffd700,
      },
    });
    label.anchor.set(0.5);
    label.x = 20;
    label.y = 20;
    this.addChild(label);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", (): void => {
      this.emit("paytable");
    });
  }
}
