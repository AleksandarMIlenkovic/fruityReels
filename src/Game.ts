import { Application } from "pixi.js";
import { Scene } from "./scenes/Scene";
import { PreloaderScene } from "./scenes/PreloaderScene";
import { GameScene } from "./scenes/GameScene";

export class Game {
  private app!: Application;
  private currentScene: Scene | null = null;

  public async start(): Promise<void> {
    this.app = new Application();
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      background: "#1a0a2e",
      resizeTo: window,
      antialias: true,
      roundPixels: true,
    });

    document.getElementById("pixi-container")!.appendChild(this.app.canvas);

    this.app.renderer.on("resize", () => this.onResize());
    window.addEventListener("orientationchange", () => this.onResize());

    const preloader = new PreloaderScene(this.app);
    await this.switchScene(preloader);

    await this.switchScene(new GameScene(this.app, preloader.soundManager));
  }

  private async switchScene(scene: Scene): Promise<void> {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy();
    }
    this.currentScene = scene;
    this.app.stage.addChild(scene);
    await scene.init();
    this.onResize();
  }

  private onResize(): void {
    this.currentScene?.resize(this.app.screen.width, this.app.screen.height);
  }
}
