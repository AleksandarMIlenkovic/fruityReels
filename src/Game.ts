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
    Assets.addBundle("game", {
      Cherry: "/assets/Cherry.png",
      Seven: "/assets/Seven.png",
      Bar: "/assets/Bar.png",
      Bell: "/assets/Bell.png",
      Diamond: "/assets/Diamond.png",
      Lemon: "/assets/Lemon.png",
      Plum: "/assets/Plum.png",
      Wild: "/assets/Wild.png",
      ReelFrame: "/assets/ReelFrame.png",
      ReelSeperator: "/assets/ReelSeperator.png",
      SpinButton: "/assets/SpinButton.png",
      WinField: "/assets/WinField.png",
      BetField: "/assets/BetField.png",
      font: { src: "/assets/PixelifySans-Bold.ttf", data: { family: "PixelifySans-Bold" } },
    });
    await Assets.loadBundle("game");
  }
}
