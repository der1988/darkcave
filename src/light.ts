import { roomLight } from "./environments";
import { visible } from "./world";
export type Point = { x: number; y: number };
export type Lamp = Point & { angle: number; on: boolean };
export const RANGE = 9.5;
export function smooth(a: number, b: number, n: number) {
  const t = Math.max(0, Math.min(1, (n - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
/** Shared by architecture, creature rendering, and detection. No ambient term. */
export function beam(
  lamp: Lamp,
  x: number,
  y: number,
  z = 0.5,
  nx = 0,
  ny = 0,
): number {
  if (!lamp.on) return 0;
  const dx = x - lamp.x,
    dy = y - lamp.y,
    distance = Math.hypot(dx, dy);
  if (distance > RANGE) return 0;
  const dot =
    distance < 0.01
      ? 1
      : (dx * Math.cos(lamp.angle) + dy * Math.sin(lamp.angle)) / distance;
  const cone = smooth(Math.cos(0.51), Math.cos(0.25), dot);
  if (cone === 0 || !visible(lamp.x, lamp.y, x + nx * 0.012, y + ny * 0.012))
    return 0;
  const falloff =
    (1 - smooth(1.2, RANGE, distance)) / (1 + distance * distance * 0.014);
  const incidence =
    nx || ny
      ? 0.35 +
        0.65 * Math.max(0, -(dx * nx + dy * ny) / Math.max(0.01, distance))
      : 1;
  return (
    cone * falloff * incidence * (1 - smooth(0.85, 1.75, Math.abs(z - 0.48)))
  );
}
export function surfaceLight(
  lamp: Lamp,
  x: number,
  y: number,
  z: number,
  nx = 0,
  ny = 0,
) {
  // Ambient visibility belongs to authored rooms. Truly dark spaces receive
  // light only from the directional flashlight beam.
  return Math.min(
    1,
    beam(lamp, x, y, z, nx, ny) +
      roomLight(x + nx * 0.012, y + ny * 0.012, z) * (nx || ny ? 0.85 : 1),
  );
}
