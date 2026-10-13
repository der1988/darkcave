import { Creature } from "./creature";
import { isSafe, roomLight } from "./environments";
import { inView } from "./vision";
import { visible } from "./world";
import { beam, type Point, type Lamp } from "./light";
import type { SoundEvents } from "./sound-events";
export type EnemyKind = "zombie" | "clicker";
export const ENEMY_SPAWNS: [string, EnemyKind, Point][] = [
  ["z-yellow", "zombie", { x: 60.5, y: 30.5 }],
  ["z-arrival", "zombie", { x: 59.5, y: 58.5 }],
  ["c-service", "clicker", { x: 89.5, y: 56.5 }],
  ["z-service", "zombie", { x: 87.5, y: 24.5 }],
  ["c-parking", "clicker", { x: 57.5, y: 84.5 }],
  ["z-parking", "zombie", { x: 47.5, y: 88.5 }],
  ["z-hotel", "zombie", { x: 11.5, y: 72.5 }],
  ["c-hotel", "clicker", { x: 6.5, y: 83.5 }],
];
export class Inhabitant {
  ai: Creature;
  lastHeard = -1;
  voiceIn = 5;
  attackIn = 0;
  constructor(
    public id: string,
    public kind: EnemyKind,
    position: Point,
  ) {
    this.ai = new Creature(
      Math.random,
      isSafe,
      kind === "clicker" ? 2.15 : 1.4,
    );
    this.ai.position = { ...position };
  }
  update(
    dt: number,
    brothers: Point[],
    lamp: Lamp,
    noises: SoundEvents,
    time: number,
  ) {
    this.attackIn = Math.max(0, this.attackIn - dt);
    this.voiceIn -= dt;
    const sound = noises.heard(
      this.ai.position,
      this.kind === "clicker" ? 1 : 0.5,
      this.lastHeard,
    );
    let observation: Point | null = sound?.position || null;
    if (sound) this.lastHeard = sound.timestamp;
    if (this.kind === "zombie")
      for (const p of brothers) {
        const lit = roomLight(p.x, p.y, 0.4) + beam(lamp, p.x, p.y, 0.4);
        if (
          !isSafe(p.x, p.y) &&
          inView(
            this.ai.position,
            this.ai.heading,
            p,
            lit > 0.06 ? 7 : 1.4,
            Math.PI * 0.6,
          ) &&
          visible(this.ai.position.x, this.ai.position.y, p.x, p.y)
        ) {
          observation = p;
          break;
        }
      }
    this.ai.update(dt, observation);
    const struck =
      this.attackIn <= 0
        ? brothers.findIndex((p) => this.ai.canCapture(p))
        : -1;
    if (struck >= 0) this.attackIn = 1.4;
    return struck;
  }
}
export const createInhabitants = () =>
  ENEMY_SPAWNS.map(([id, kind, p]) => new Inhabitant(id, kind, p));
