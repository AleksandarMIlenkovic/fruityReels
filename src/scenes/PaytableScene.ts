import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { SYMBOLS, SymbolName, GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { SYMBOL_VALUES } from "../config/SymbolValues";

const PANEL_WIDTH: number = 740;
const PANEL_HEIGHT: number = 480;
const PANEL_X: number = (GAME_WIDTH - PANEL_WIDTH) / 2;
const PANEL_Y: number = (GAME_HEIGHT - PANEL_HEIGHT) / 2;

const ICON_SIZE: number = 48;
const ROW_HEIGHT: number = 46;
const COLUMN_COUNT: number = 2;
const ROWS_PER_COLUMN: number = Math.ceil(SYMBOLS.length / COLUMN_COUNT);
const GRID_TOP: number = 76;
const COLUMN_WIDTH: number = PANEL_WIDTH / COLUMN_COUNT;

/**
 * PaytableScene is a full overlay rendered on top of the game.
 * It displays each symbol, its name, and its 3-of-a-kind payout value.
 * It is added to and removed from the gameContainer by GameScene.
 */
export class PaytableScene extends Container {
  constructor() {
    super();
    this.buildPanel();
  }

  private buildPanel(): void {
    const panel: Container = new Container();
    panel.x = PANEL_X;
    panel.y = PANEL_Y;
    this.addChild(panel);

    const bg: Graphics = new Graphics()
      .roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 12)
      .fill(0x1a0a2e)
      .stroke({ color: 0xffd700, width: 2 });
    panel.addChild(bg);

    const title: Text = new Text({
      text: "PAYTABLE  —  3 of a kind",
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 28,
        fill: 0xffd700,
      },
    });
    title.anchor.set(0.5, 0);
    title.x = PANEL_WIDTH / 2;
    title.y = 24;
    panel.addChild(title);

    for (let i: number = 0; i < SYMBOLS.length; i++) {
      const symbolName: SymbolName = SYMBOLS[i];
      const column: number = Math.floor(i / ROWS_PER_COLUMN);
      const row: number = i % ROWS_PER_COLUMN;

      const entryX: number = column * COLUMN_WIDTH + 24;
      const entryY: number = GRID_TOP + row * ROW_HEIGHT;

      panel.addChild(this.buildEntry(symbolName, entryX, entryY));
    }

    panel.addChild(this.buildCloseButton());
  }

  private buildEntry(symbolName: SymbolName, x: number, y: number): Container {
    const entry: Container = new Container();
    entry.x = x;
    entry.y = y;

    const icon: Sprite = new Sprite(Texture.from(symbolName));
    icon.width = ICON_SIZE;
    icon.height = ICON_SIZE;
    icon.y = (ROW_HEIGHT - ICON_SIZE) / 2;
    entry.addChild(icon);

    const nameLabel: Text = new Text({
      text: symbolName,
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 18,
        fill: symbolName === "Wild" ? 0xff88ff : 0xffffff,
      },
    });
    nameLabel.anchor.set(0, 0.5);
    nameLabel.x = ICON_SIZE + 12;
    nameLabel.y = ROW_HEIGHT / 2;
    entry.addChild(nameLabel);

    const value: number = SYMBOL_VALUES[symbolName];
    const valueLabel: Text = new Text({
      text: `${value} pts`,
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 18,
        fill: 0xffd700,
      },
    });
    valueLabel.anchor.set(1, 0.5);
    valueLabel.x = COLUMN_WIDTH - 32;
    valueLabel.y = ROW_HEIGHT / 2;
    entry.addChild(valueLabel);

    return entry;
  }

  private buildCloseButton(): Container {
    const button: Container = new Container();
    button.x = PANEL_WIDTH / 2 - 60;
    button.y = PANEL_HEIGHT - 50;

    const bg: Graphics = new Graphics()
      .roundRect(0, 0, 120, 40, 8)
      .fill(0x2a0a4e)
      .stroke({ color: 0xffd700, width: 1 });
    button.addChild(bg);

    const label: Text = new Text({
      text: "CLOSE",
      style: {
        fontFamily: "PixelifySans-Bold",
        fontSize: 18,
        fill: 0xffd700,
      },
    });
    label.anchor.set(0.5);
    label.x = 60;
    label.y = 20;
    button.addChild(label);

    button.eventMode = "static";
    button.cursor = "pointer";
    button.on("pointerdown", (): void => {
      this.emit("close");
    });

    return button;
  }
}
