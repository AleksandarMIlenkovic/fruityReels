import { Application, Container } from "pixi.js";
import { Scene } from "./Scene";
import { Reels } from "../components/Reels";
import { SpinController } from "../logic/SpinController";
import { WinAnimator } from "../logic/WinAnimator";
import { SparkleEmitter } from "../components/SparkleEmitter";
import { SoundManager } from "../audio/SoundManager";
import { SpinButton } from "../ui/SpinButton";
import { WinDisplay } from "../ui/WinDisplay";
import { BetSelector } from "../ui/BetSelector";
import { PaytableButton } from "../ui/PaytableButton";
import { OutcomeSelector } from "../ui/OutcomeSelector";
import { PaytableScene } from "./PaytableScene";
import { EvalResult, WinEvaluator } from "../logic/WinEvaluator";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";

// All positions in the 1280x720 virtual space.
// Every value is a flat number — changing one moves only that element.
// SparkleEmitter bounds (FRAME_*) must be kept in sync with REELS_* by hand.
const REELS_X: number = 640;
const REELS_Y: number = 360;

const SPIN_BUTTON_X: number = 640;
const SPIN_BUTTON_Y: number = 635;

const BET_SELECTOR_X: number = 380;
const BET_SELECTOR_Y: number = 635;

const WIN_DISPLAY_X: number = 900;
const WIN_DISPLAY_Y: number = 635;

const PAYTABLE_BUTTON_X: number = 900;
const PAYTABLE_BUTTON_Y: number = 50;

const OUTCOME_SELECTOR_X: number = 300;
const OUTCOME_SELECTOR_Y: number = 0;

const FRAME_LEFT: number = 425;
const FRAME_TOP: number = 165;
const FRAME_RIGHT: number = 855;
const FRAME_BOTTOM: number = 555;

export class GameScene extends Scene {
  private readonly app: Application;
  private readonly gameContainer: Container;
  private reels!: Reels;
  private spinController!: SpinController;
  private winAnimator!: WinAnimator;
  private sparkleEmitter!: SparkleEmitter;
  private soundManager!: SoundManager;
  private spinButton!: SpinButton;
  private betSelector!: BetSelector;
  private paytableButton!: PaytableButton;
  private winDisplay!: WinDisplay;
  private outcomeSelector!: OutcomeSelector;

  constructor(app: Application) {
    super();
    this.app = app;
    this.gameContainer = new Container();
    this.addChild(this.gameContainer);
  }

  public async init(): Promise<void> {
    this.reels = new Reels(this.app);
    this.reels.x = REELS_X;
    this.reels.y = REELS_Y;
    this.gameContainer.addChild(this.reels);

    this.spinController = new SpinController(this.reels);

    this.outcomeSelector = new OutcomeSelector();
    await this.outcomeSelector.loadOutcomes();

    this.spinButton = new SpinButton();
    this.spinButton.x = SPIN_BUTTON_X;
    this.spinButton.y = SPIN_BUTTON_Y;
    this.spinButton.scale.set(0.4, 0.4);
    this.spinButton.on("spin", (): void => this.startSpin());
    this.gameContainer.addChild(this.spinButton);

    this.betSelector = new BetSelector();
    this.betSelector.scale.set(0.5, 0.5);
    this.betSelector.x = BET_SELECTOR_X;
    this.betSelector.y = BET_SELECTOR_Y;
    this.gameContainer.addChild(this.betSelector);

    this.winDisplay = new WinDisplay();
    this.winDisplay.x = WIN_DISPLAY_X;
    this.winDisplay.y = WIN_DISPLAY_Y;
    this.winDisplay.width = this.betSelector.width;
    this.winDisplay.scale.y = this.winDisplay.scale.x;
    this.gameContainer.addChild(this.winDisplay);

    this.paytableButton = new PaytableButton();
    this.paytableButton.x = PAYTABLE_BUTTON_X;
    this.paytableButton.y = PAYTABLE_BUTTON_Y;
    this.paytableButton.on("paytable", (): void => this.openPaytable());
    this.gameContainer.addChild(this.paytableButton);

    this.soundManager = new SoundManager();
    await this.soundManager.load();
    this.soundManager.playBackground();

    this.winAnimator = new WinAnimator(
      this.app,
      this.reels.getReels(),
      this.winDisplay,
    );

    this.sparkleEmitter = new SparkleEmitter(
      this.app,
      FRAME_LEFT,
      FRAME_TOP,
      FRAME_RIGHT,
      FRAME_BOTTOM,
    );
    this.gameContainer.addChild(this.sparkleEmitter);

    this.spinController.on("spinStart", (): void => {
      this.winAnimator.stop();
      this.sparkleEmitter.stop();
      this.spinButton.setEnabled(false);
      this.winDisplay.showLoss();
      this.soundManager.play("spin");
    });

    this.spinController.on("spinEnd", (result: EvalResult): void => {
      this.spinButton.setEnabled(true);
      if (result.win) {
        const amount: number = WinEvaluator.calculateWinAmount(
          result.winLines,
          this.betSelector.getBet(),
        );
        this.winDisplay.showAmount(amount);
        this.winAnimator.start(result.winLines);
        this.sparkleEmitter.start();
        this.soundManager.play("win");
      } else {
        this.winDisplay.showLoss();
        this.soundManager.play("lose");
      }
    });

    window.addEventListener("keydown", this.onKeyDown);

    this.resize(this.app.screen.width, this.app.screen.height);
  }

  public resize(screenWidth: number, screenHeight: number): void {
    if (!this.reels) return;

    const scale: number = Math.min(
      screenWidth / GAME_WIDTH,
      screenHeight / GAME_HEIGHT,
    );

    const offsetX: number = (screenWidth - GAME_WIDTH * scale) / 2;
    const offsetY: number = (screenHeight - GAME_HEIGHT * scale) / 2;

    this.gameContainer.scale.set(scale);
    this.gameContainer.x = offsetX;
    this.gameContainer.y = offsetY;

    this.outcomeSelector.setTransform(
      OUTCOME_SELECTOR_X,
      OUTCOME_SELECTOR_Y,
      scale,
      offsetX,
      offsetY,
    );
  }

  public override destroy(): void {
    this.winAnimator.stop();
    this.sparkleEmitter.stop();
    this.soundManager.stopBackground();
    this.outcomeSelector.destroy();
    window.removeEventListener("keydown", this.onKeyDown);
    super.destroy();
  }

  private startSpin(): void {
    this.soundManager.play("button");
    this.spinController.requestSpin(this.outcomeSelector.getSelectedOutcome());
  }

  private openPaytable(): void {
    this.soundManager.play("button");
    const paytable: PaytableScene = new PaytableScene();
    paytable.on("close", (): void => {
      this.soundManager.play("button");
      this.gameContainer.removeChild(paytable);
    });
    this.gameContainer.addChild(paytable);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "w" || e.key === "W") {
      this.startSpin();
    }
  };
}
