const GAME_KEYS = [
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "f",
];

export class InputState {
  private keys = new Set<string>();

  constructor(toggleFlashlight: () => void) {
    addEventListener("blur", () => this.keys.clear());
    addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (GAME_KEYS.includes(key)) event.preventDefault();
      if ((key === " " || key === "f") && !event.repeat) toggleFlashlight();
      this.keys.add(key === "shift" ? "shift" : key);
    });
    addEventListener("keyup", (event) =>
      this.keys.delete(event.key.toLowerCase()),
    );
  }

  movement() {
    return {
      horizontal:
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft")),
      vertical:
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup")),
      running: this.keys.has("shift"),
    };
  }
}
