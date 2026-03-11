import { Application, Container, Graphics, Text } from "pixi.js";
import { Scene } from "./Scene";
import { SoundManager } from "../audio/SoundManager";

export class StartScene extends Scene {
  private readonly app: Application;
  private centerContainer!: Container;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  public async init(): Promise<void> {
    this.centerContainer = new Container();
    this.addChild(this.centerContainer);

    const title = new Text({
      text: "FRUITY REELS",
      style: { fill: 0xffd700, fontSize: 36, fontFamily: "PixelifySans-Bold" },
    });
    title.anchor.set(0.5);
    title.y = 0;
    this.centerContainer.addChild(title);

    const button = new Container();
    button.eventMode = "static";
    button.cursor = "pointer";

    const bg = new Graphics().roundRect(-120, 120, 240, 80, 12).fill(0xffd700);
    button.addChild(bg);

    const buttonText = new Text({
      text: "PLAY",
      style: { fill: 0x1a0a2e, fontSize: 36, fontFamily: "PixelifySans-Bold" },
    });
    buttonText.y = 160;
    buttonText.anchor.set(0.5);
    button.addChild(buttonText);

    button.on("pointerover", () => (bg.tint = 0xffee88));
    button.on("pointerout", () => (bg.tint = 0xffffff));

    this.centerContainer.addChild(button);
    this.centerContainer.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
    );

    return new Promise((resolve) => {
      button.on("pointerdown", () => {
        SoundManager.getInstance().resumeContext();
        resolve();
      });
    });
  }

  public resize(screenWidth: number, screenHeight: number): void {
    if (this.centerContainer) {
      this.centerContainer.position.set(screenWidth / 2, screenHeight / 2);
    }
  }
}
