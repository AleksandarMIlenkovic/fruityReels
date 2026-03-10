import { Container } from "pixi.js";
import { WinField } from "./WinField";

export class WinDisplay extends Container {
  private readonly field: WinField;

  constructor() {
    super();
    this.field = new WinField();
    this.addChild(this.field);
    this.showAmount(0);
  }

  public showAmount(amount: number): void {
    this.field.setText(String(amount));
  }

  public showLoss(): void {
    this.showAmount(0);
  }
}
