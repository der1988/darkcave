import type { Point } from "./geometry";
import { COMPUTER, MEMORY, EXIT } from "./room";
import { visible } from "./lighting";
export type Progress = {
  doorOpen: boolean;
  memoryCollected: boolean;
  finished: boolean;
};
export class Mechanisms {
  private state: Progress = {
    doorOpen: false,
    memoryCollected: false,
    finished: false,
  };
  snapshot() {
    return { ...this.state };
  }
  private target(player: Point): "computer" | "memory" | "exit" | null {
    const near = (target: Point) =>
      Math.hypot(player.x - target.x, player.y - target.y) < 1 &&
      visible(
        { ...player, z: 0.3 },
        { ...target, z: 0.3 },
        this.state.doorOpen,
      );
    if (!this.state.doorOpen && near(COMPUTER)) return "computer";
    if (!this.state.memoryCollected && near(MEMORY)) return "memory";
    if (!this.state.finished && near(EXIT)) return "exit";
    return null;
  }
  hint(player: Point) {
    const target = this.target(player);
    return target
      ? {
          computer: "E · Apri il passaggio",
          memory: "E · Recupera il ricordo",
          exit: "E · Esci",
        }[target]
      : null;
  }
  interact(player: Point) {
    const target = this.target(player);
    if (!target) return false;
    if (target === "computer") this.state.doorOpen = true;
    else if (target === "memory") this.state.memoryCollected = true;
    else this.state.finished = true;
    return true;
  }
}
