import { visible } from "./world";
import { beam, type Lamp, type Point } from "./light";
import { roomLight } from "./environments";
export function inView(
  observer: Point,
  angle: number,
  p: Point,
  range = 11,
  fov = (Math.PI * 2) / 3,
) {
  const dx = p.x - observer.x,
    dy = p.y - observer.y,
    d = Math.hypot(dx, dy);
  return (
    d <= range &&
    (d < 0.65 || Math.cos(Math.atan2(dy, dx) - angle) >= Math.cos(fov / 2))
  );
}
/** Dynamic entities never use explored memory or dark-adapted architectural edges. */
export function perceived(
  observer: Point,
  angle: number,
  lamp: Lamp,
  p: Point,
  dynamic = true,
) {
  if (!inView(observer, angle, p) || !visible(observer.x, observer.y, p.x, p.y))
    return false;
  const d = Math.hypot(p.x - observer.x, p.y - observer.y);
  return (
    roomLight(p.x, p.y, 0.3) > 0.055 ||
    beam(lamp, p.x, p.y, 0.3) > 0.025 ||
    (!dynamic && d < 1.7)
  );
}
