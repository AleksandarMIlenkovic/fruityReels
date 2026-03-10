import { Container, Sprite, Texture } from "pixi.js";
import { SYMBOLS, SYMBOL_SIZE, SymbolName } from "../constants";

export class Symbol extends Container {
  private readonly sprite: Sprite;
  private _symbolName: SymbolName;

  constructor(name: SymbolName) {
    super();
    this._symbolName = name;
    this.sprite = new Sprite(Texture.from(`/assets/${name}.png`));
    this.sprite.width = SYMBOL_SIZE;
    this.sprite.height = SYMBOL_SIZE;
    this.pivot.set(SYMBOL_SIZE / 2, SYMBOL_SIZE / 2);
    this.addChild(this.sprite);
  }

  public get symbolName(): SymbolName {
    return this._symbolName;
  }

  public setSymbol(name: SymbolName): void {
    if (name === this._symbolName) return;
    this._symbolName = name;
    this.sprite.texture = Texture.from(`/assets/${name}.png`);
  }

  public static randomName(): SymbolName {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }
}
