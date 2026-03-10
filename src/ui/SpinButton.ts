import { Container, Sprite, Texture } from "pixi.js";

export class SpinButton extends Container {
  private readonly sprite: Sprite;

  constructor() {
    super();
    this.sprite = new Sprite(Texture.from("SpinButton"));
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.onClick);
  }

  public setEnabled(enabled: boolean): void {
    this.eventMode = enabled ? "static" : "none";
    this.alpha = enabled ? 1 : 0.5;
  }

  private onClick = (): void => {
    this.emit("spin");
  };
}
