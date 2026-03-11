import { Outcome } from "../config/Outcome";

const RANDOM_VALUE: string = "SELECT OUTCOME";

/**
 * OutcomeSelector is an HTML <select> element rendered on top of the canvas.
 * It loads outcomes from /outcomes.json and exposes the currently selected one.
 * Returns null when "Random" is selected.
 */
export class OutcomeSelector {
  private readonly select: HTMLSelectElement;
  private outcomes: Outcome[] = [];

  constructor() {
    this.select = document.createElement("select");
    this.select.style.position = "absolute";
    this.select.style.background = "#1a0a2e";
    this.select.style.color = "#ffd700";
    this.select.style.border = "1px solid #ffd700";
    this.select.style.borderRadius = "4px";
    this.select.style.padding = "4px 8px";
    this.select.style.fontSize = "24px";
    this.select.style.cursor = "pointer";
    document.body.appendChild(this.select);
  }

  public async loadOutcomes(): Promise<void> {
    const response: Response = await fetch(
      `${import.meta.env.BASE_URL}outcomes.json`,
    );
    this.outcomes = (await response.json()) as Outcome[];
    this.populate();
  }

  public getSelectedOutcome(): Outcome | null {
    if (this.select.value === RANDOM_VALUE) return null;
    const index: number = parseInt(this.select.value, 10);
    return this.outcomes[index] ?? null;
  }

  public setTransform(
    virtualX: number,
    virtualY: number,
    scale: number,
    offsetX: number,
    offsetY: number,
  ): void {
    this.select.style.left = `${virtualX * scale + offsetX}px`;
    this.select.style.top = `${virtualY * scale + offsetY}px`;
    this.select.style.transformOrigin = "top left";
    this.select.style.transform = `scale(${scale})`;
  }

  public destroy(): void {
    this.select.remove();
  }

  private populate(): void {
    const randomOption: HTMLOptionElement = document.createElement("option");
    randomOption.value = RANDOM_VALUE;
    randomOption.text = RANDOM_VALUE;
    this.select.appendChild(randomOption);

    for (let i: number = 0; i < this.outcomes.length; i++) {
      const option: HTMLOptionElement = document.createElement("option");
      option.value = String(i);
      option.text = this.outcomes[i].name;
      this.select.appendChild(option);
    }
  }
}
