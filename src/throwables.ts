import type { Point } from "./geometry";
import { visible } from "./lighting";
import { ROOM, FIXTURES } from "./room";

export type SoundEvent = Point & {
  source: "player" | "brother" | "stone" | "bottle";
  loudness?: number;
};
export type Throwable = Point & {
  id: string;
  kind: "stone" | "bottle";
  state: "ground" | "held" | "flying" | "broken";
  z: number;
  vx: number;
  vy: number;
  vz: number;
  impacts: number;
};
const placements = [
  { kind: "stone", x: 1.2, y: 1.8 },
  { kind: "stone", x: 1.2, y: 2.3 },
  { kind: "stone", x: 5.3, y: 2.8 },
  { kind: "stone", x: 10.8, y: 5.2 },
  { kind: "stone", x: 4.8, y: 7.9 },
  { kind: "bottle", x: 4.9, y: 2.2 },
  { kind: "bottle", x: 13.8, y: 2.2 },
] as const;
export class Throwables {
  constructor(private unlocked: () => boolean = () => false) {}
  private items: Throwable[] = placements.map((p, i) => ({
    ...p,
    id: `object-${i}`,
    state: "ground",
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    impacts: 0,
  }));
  private charge: number | null = null;
  snapshot() {
    return this.items.map((item) => ({ ...item }));
  }
  held() {
    return this.items.find((item) => item.state === "held") ?? null;
  }
  power() {
    return this.charge === null ? null : Math.min(1, this.charge / 1.2);
  }
  pickUp(id: string, player: Point) {
    const item = this.items.find((item) => item.id === id);
    if (
      this.held() ||
      !item ||
      item.state !== "ground" ||
      Math.hypot(item.x - player.x, item.y - player.y) > 1
    )
      return false;
    if (!visible({ ...player, z: 0.12 }, { ...item, z: 0.12 }, this.unlocked()))
      return false;
    item.state = "held";
    return true;
  }
  beginCharge() {
    if (this.held()) this.charge = 0;
  }
  cancelCharge() {
    this.charge = null;
  }
  release(player: Point, angle: number) {
    const item = this.held(),
      power = this.power();
    this.charge = null;
    if (!item || power === null) return false;
    const speed = 1.8 + power * 5;
    item.state = "flying";
    item.x = player.x;
    item.y = player.y;
    item.z = 0.38;
    item.vx = Math.cos(angle) * speed;
    item.vy = Math.sin(angle) * speed;
    item.vz = 1 + power * 1.8;
    item.impacts = 0;
    return true;
  }
  update(dt: number, player: Point): SoundEvent[] {
    if (this.charge !== null) this.charge += dt;
    const sounds: SoundEvent[] = [];
    const impact = (item: Throwable) => {
      item.impacts++;
      sounds.push({
        x: item.x,
        y: item.y,
        source: item.kind,
        loudness:
          item.kind === "bottle"
            ? 1.6
            : Math.max(0.4, 0.9 - item.impacts * 0.12),
      });
      if (item.kind === "bottle") {
        item.state = "broken";
        item.z = 0;
        item.vx = item.vy = item.vz = 0;
      }
    };
    for (const item of this.items) {
      if (item.state === "held") {
        item.x = player.x;
        item.y = player.y;
        continue;
      }
      if (item.state !== "flying") continue;
      // Small substeps keep fast throws from tunnelling through walls or furniture.
      const count = Math.max(1, Math.ceil(dt / 0.008)),
        step = dt / count;
      for (let i = 0; i < count && item.state === "flying"; i++) {
        const previous = { x: item.x, y: item.y, z: item.z };
        item.vz -= 8 * step;
        const next = {
          x: item.x + item.vx * step,
          y: item.y + item.vy * step,
          z: item.z + item.vz * step,
        };
        const hitsProp = FIXTURES.some(
          (p) =>
            next.z < p.height &&
            next.x >= p.x &&
            next.x <= p.x + p.width &&
            next.y >= p.y &&
            next.y <= p.y + p.depth,
        );
        const hitWall =
          !visible(previous, next, this.unlocked()) ||
          next.x < 0.12 ||
          next.y < 0.12 ||
          next.x > ROOM.width - 0.12 ||
          next.y > ROOM.height - 0.12;
        if (hitWall || hitsProp) {
          impact(item);
          if (item.kind === "bottle") break;
          item.vx *= -0.42;
          item.vy *= -0.42;
          // Separate from the collider instead of producing repeated impacts in place.
          item.x = Math.max(
            0.12,
            Math.min(ROOM.width - 0.12, item.x + item.vx * step),
          );
          item.y = Math.max(
            0.12,
            Math.min(ROOM.height - 0.12, item.y + item.vy * step),
          );
        } else {
          item.x = next.x;
          item.y = next.y;
        }
        item.z = next.z;
        if (item.z <= 0) {
          item.z = 0;
          impact(item);
          if (item.kind === "bottle") break;
          item.vz = Math.abs(item.vz) * 0.42;
          item.vx *= 0.58;
          item.vy *= 0.58;
          if (item.impacts >= 4 || item.vz < 0.38) {
            item.state = "ground";
            item.vx = item.vy = item.vz = 0;
          }
        }
      }
    }
    return sounds;
  }
}
