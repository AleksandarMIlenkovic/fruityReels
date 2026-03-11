import { Application, Assets, Text } from "pixi.js";
import { Scene } from "./Scene";
import { SoundManager } from "../audio/SoundManager";

export class PreloaderScene extends Scene {
  private readonly app: Application;
  private loadingText!: Text;
  public soundManager!: SoundManager;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  public async init(): Promise<void> {
    this.loadingText = new Text({
      text: "Loading...",
      style: { fill: 0xffffff, fontSize: 32 },
    });
    this.loadingText.anchor.set(0.5);
    this.loadingText.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
    );
    this.addChild(this.loadingText);

    await this.loadAssets();

    this.soundManager = new SoundManager();
    await this.soundManager.load();
  }

  public resize(screenWidth: number, screenHeight: number): void {
    if (this.loadingText) {
      this.loadingText.position.set(screenWidth / 2, screenHeight / 2);
    }
  }

  private async loadAssets(): Promise<void> {
    const base: string = import.meta.env.BASE_URL;
    Assets.addBundle("game", {
      Cherry: `${base}assets/Cherry.png`,
      Seven: `${base}assets/Seven.png`,
      Bar: `${base}assets/Bar.png`,
      Bell: `${base}assets/Bell.png`,
      Diamond: `${base}assets/Diamond.png`,
      Lemon: `${base}assets/Lemon.png`,
      Plum: `${base}assets/Plum.png`,
      Wild: `${base}assets/Wild.png`,
      ReelFrame: `${base}assets/ReelFrame.png`,
      ReelSeperator: `${base}assets/ReelSeperator.png`,
      SpinButton: `${base}assets/SpinButton.png`,
      WinField: `${base}assets/WinField.png`,
      BetField: `${base}assets/BetField.png`,
      font: {
        src: `${base}assets/PixelifySans-Bold.ttf`,
        data: { family: "PixelifySans-Bold" },
      },
    });
    await Assets.loadBundle("game");
  }
}
