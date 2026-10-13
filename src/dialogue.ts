import { MEMORY_ROOMS, contains, inHome } from "./levels";
import { ANOMALIES } from "./environments";
import type { Point } from "./light";
import { visible } from "./world";
export type Speech = {
  speaker: "older" | "child" | "mother" | "father";
  text: string;
  position?: Point;
};
export class Dialogue {
  current: Speech | null = null;
  private queue: Speech[] = [];
  private age = 0;
  private cooldown = 4;
  private afterDanger = false;
  update(
    dt: number,
    p: Point,
    child: Point,
    silent: boolean,
    danger: boolean,
    events: string[],
    canSee: (p: Point) => boolean,
  ) {
    this.cooldown -= dt;
    if (silent || danger) {
      this.current = null;
      this.queue = [];
      this.age = 0;
      this.cooldown = Math.max(this.cooldown, 14);
      if (danger) this.afterDanger = true;
      return;
    }
    if (this.current) {
      this.age -= dt;
      if (this.age <= 0) {
        this.current = this.queue.shift() || null;
        this.age = 4;
      }
    } else if (this.queue.length) {
      this.current = this.queue.shift()!;
      this.age = 4;
    }
    if (this.current || this.cooldown > 0) return;
    for (const r of MEMORY_ROOMS)
      if (
        contains(r, p.x, p.y) &&
        Math.hypot(p.x - r.person.x, p.y - r.person.y) < 4 &&
        canSee(r.person) &&
        !events.includes(r.id)
      ) {
        events.push(r.id);
        this.say([
          {
            speaker: r.id === "kitchen" ? "mother" : "father",
            text: r.line,
            position: r.person,
          },
        ]);
        return;
      }
    if (
      Math.hypot(child.x - p.x, child.y - p.y) > 2 ||
      !visible(p.x, p.y, child.x, child.y)
    )
      return;
    if (this.afterDanger) {
      this.afterDanger = false;
      this.say([
        { speaker: "child", text: "Ho paura." },
        { speaker: "older", text: "Ci sono io." },
      ]);
      return;
    }
    if (inHome(p) && !events.includes("home-greeting")) {
      events.push("home-greeting");
      this.say([
        { speaker: "child", text: "Possiamo lasciare qui le nostre cose?" },
        { speaker: "older", text: "Sì. Poi torniamo a cercare." },
      ]);
      return;
    }
    if (
      ANOMALIES.some(
        (a) =>
          a.kind === "armchair" &&
          canSee({ x: a.x - 0.1, y: a.y + 0.5 }) &&
          Math.hypot(a.x - p.x, a.y - p.y) < 4,
      ) &&
      !events.includes("chair-dialogue")
    ) {
      events.push("chair-dialogue");
      this.say([
        { speaker: "child", text: "Perché quella poltrona è dentro il muro?" },
        { speaker: "older", text: "Non lo so." },
      ]);
      return;
    }
    if (!events.includes("lost-dialogue") && !inHome(p)) {
      events.push("lost-dialogue");
      this.say([
        { speaker: "child", text: "Ma siamo già passati di qui?" },
        { speaker: "older", text: "Non mi sembra." },
        { speaker: "child", text: "A me sì." },
      ]);
      return;
    }
    this.cooldown = 35;
  }
  private say(lines: Speech[]) {
    this.current = lines[0];
    this.queue = lines.slice(1);
    this.age = 4.5;
    this.cooldown = 50 + Math.random() * 30;
  }
  clear() {
    this.current = null;
    this.queue = [];
    this.cooldown = 8;
  }
}
