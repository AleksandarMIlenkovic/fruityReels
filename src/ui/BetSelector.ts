import { Container, Text } from "pixi.js";
import { BetField } from "./BetField";
import { BET_VALUES, DEFAULT_BET_INDEX } from "../constants";

const ARROW_STYLE = {
  fontFamily: "PixelifySans-Bold",
  fontSize: 80,
  fill: 0x00e5ff,
  align: "center",
} as const;

// Horizontal distance from field center to the arrow buttons
const ARROW_X_OFFSET: number = 150;

// Match the value text y offset so arrows sit on the same baseline
const ARROW_Y_OFFSET: number = 0;

export class BetSelector extends Container {
  private readonly field: BetField;
  private readonly leftArrow: Text;
  private readonly rightArrow: Text;
  private betIndex: number;

  constructor() {
    super();

    this.betIndex = DEFAULT_BET_INDEX;

    this.field = new BetField();
    this.field.setText(String(BET_VALUES[this.betIndex]));
    this.addChild(this.field);

    this.leftArrow = new Text({ text: "<", style: ARROW_STYLE });
    this.leftArrow.anchor.set(0.5);
    this.leftArrow.x = -ARROW_X_OFFSET;
    this.leftArrow.y = ARROW_Y_OFFSET;
    this.leftArrow.eventMode = "static";
    this.leftArrow.cursor = "pointer";
    this.leftArrow.on("pointerdown", this.onDecrement);
    this.addChild(this.leftArrow);

    this.rightArrow = new Text({ text: ">", style: ARROW_STYLE });
    this.rightArrow.anchor.set(0.5);
    this.rightArrow.x = ARROW_X_OFFSET;
    this.rightArrow.y = ARROW_Y_OFFSET;
    this.rightArrow.eventMode = "static";
    this.rightArrow.cursor = "pointer";
    this.rightArrow.on("pointerdown", this.onIncrement);
    this.addChild(this.rightArrow);

    this.updateArrowStates();
  }

  public getBet(): number {
    return BET_VALUES[this.betIndex];
  }

  private onDecrement = (): void => {
    if (this.betIndex > 0) {
      this.betIndex--;
      this.updateDisplay();
      this.emit("betChange", this.getBet());
    }
  };

  private onIncrement = (): void => {
    if (this.betIndex < BET_VALUES.length - 1) {
      this.betIndex++;
      this.updateDisplay();
      this.emit("betChange", this.getBet());
    }
  };

  private updateDisplay(): void {
    this.field.setText(String(BET_VALUES[this.betIndex]));
    this.updateArrowStates();
  }

  private updateArrowStates(): void {
    this.leftArrow.alpha = this.betIndex > 0 ? 1 : 0.3;
    this.rightArrow.alpha = this.betIndex < BET_VALUES.length - 1 ? 1 : 0.3;
  }
}
