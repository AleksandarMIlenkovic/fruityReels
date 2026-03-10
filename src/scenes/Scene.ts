import { Container } from "pixi.js";

export abstract class Scene extends Container {
  public abstract init(): Promise<void>;
  public abstract resize(width: number, height: number): void;

  public override destroy(): void {
    super.destroy({ children: true });
  }
}
