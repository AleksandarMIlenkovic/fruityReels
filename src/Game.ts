import { Application, Assets } from "pixi.js";
import { GameScene } from "./scenes/GameScene";

export class Game {
  private app!: Application;
  private scene!: GameScene;

  public async start(): Promise<void> {
    this.app = new Application();
    await this.app.init({
      background: "#1a0a2e",
      resizeTo: window,
      antialias: true,
    });

    document.getElementById("pixi-container")!.appendChild(this.app.canvas);

    await this.loadAssets();

    this.scene = new GameScene(this.app);
    this.app.stage.addChild(this.scene);
    await this.scene.init();

    window.addEventListener("resize", (): void => {
      this.scene.resize(this.app.screen.width, this.app.screen.height);
    });
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
