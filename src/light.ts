import { visible, type Point } from "./world";

export type Lamp = Point & { angle: number; range: number; on: boolean };
export const MIN_LIGHT_RANGE = 0.35;
export const MAX_LIGHT_RANGE = 18;

function smooth(a: number, b: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function flashlightPower(range: number) {
  return 1.4 - smooth(0.8, MAX_LIGHT_RANGE, range) * 0.9;
}

export function beam(lamp: Lamp, point: Point, z = 0) {
  if (!lamp.on || !visible(lamp, point)) return 0;
  const dx = point.x - lamp.x;
  const dy = point.y - lamp.y;
  const distance = Math.hypot(dx, dy);
  if (distance > lamp.range) return 0;
  const facing =
    distance < 0.02
      ? 1
      : (dx * Math.cos(lamp.angle) + dy * Math.sin(lamp.angle)) / distance;
  const angleFromCenter = Math.acos(Math.max(-1, Math.min(1, facing)));
  const outerCone = 1 - smooth(0.16, 0.78, angleFromCenter);
  const coreCone = 1 - smooth(0.03, 0.3, angleFromCenter);
  const cone = outerCone * (0.38 + coreCone * 0.62);
  const targetPower = flashlightPower(lamp.range);
  const distanceFade = 1 - smooth(0.7, Math.max(1, lamp.range), distance) * 0.5;
  const endFade = 1 - smooth(Math.max(0, lamp.range - 0.3), lamp.range, distance);
  const height = 1 - smooth(0.8, 1.8, Math.abs(z - 0.35));
  return cone * targetPower * distanceFade * endFade * height;
}
