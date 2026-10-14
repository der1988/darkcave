import type { Point } from "./geometry";
import { ROOM, WALLS, WINDOWS } from "./room";

export type Vec3 = { x: number; y: number; z: number };
export const SUN = { x: 0.24, y: 1, z: -0.48 };
export const TORCH = { height: 0.43, range: 6, angle: 0.29, power: 1.8 };
const smooth = (x: number) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};

/** Segment occlusion uses the same walls and doorway gaps as movement. */
export function visible(from: Vec3, to: Vec3) {
  for (const wall of WALLS) {
    const dx = to.x - from.x;
    if (Math.abs(dx) < 1e-6) continue;
    const t = (wall.position - from.x) / dx;
    if (t <= 0.001 || t >= 0.999) continue;
    const y = from.y + (to.y - from.y) * t;
    const z = from.z + (to.z - from.z) * t;
    if (y >= wall.from && y <= wall.to && z >= 0 && z <= ROOM.wallHeight)
      return false;
  }
  return true;
}

export function sunlight(point: Vec3) {
  const distance = point.y / SUN.y;
  const x = point.x - SUN.x * distance;
  const z = point.z - SUN.z * distance;
  if (z < 0.43 || z > 1.13) return 0;
  for (const window of WINDOWS) {
    if (x <= window.from || x >= window.to) continue;
    if (Math.abs(x - (window.from + window.to) / 2) < 0.025) return 0;
    if (!visible({ x, y: 0.001, z }, point)) return 0;
    const edge = Math.min(x - window.from, window.to - x, z - 0.43, 1.13 - z);
    return smooth(edge / 0.07) * 0.85;
  }
  return 0;
}

export class Flashlight {
  on = true;
  angle = -Math.PI / 4;
  toggle() {
    this.on = !this.on;
  }
  origin(actor: Point): Vec3 {
    return {
      x: actor.x + Math.cos(this.angle) * 0.16,
      y: actor.y + Math.sin(this.angle) * 0.16,
      z: TORCH.height,
    };
  }
  at(point: Vec3, actor: Point) {
    if (!this.on) return 0;
    const origin = this.origin(actor);
    const dx = point.x - origin.x,
      dy = point.y - origin.y,
      dz = point.z - origin.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.015 || distance > TORCH.range || !visible(origin, point))
      return 0;
    // A slight downward pitch puts the lower half of the beam on the floor.
    const dot =
      (dx * Math.cos(this.angle) + dy * Math.sin(this.angle) - dz * 0.14) /
      (distance * Math.hypot(1, 0.14));
    const edge = Math.cos(TORCH.angle),
      core = Math.cos(TORCH.angle * 0.4);
    const cone = smooth((dot - edge) / (core - edge));
    return (
      ((TORCH.power * cone) / (1 + distance * distance * 0.22)) *
      (1 - smooth((distance - 4.8) / 1.2))
    );
  }
}

export function illumination(point: Vec3, actor: Point, torch: Flashlight) {
  return 0.19 + sunlight(point) + torch.at(point, actor);
}
