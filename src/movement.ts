import type { ActorState } from "./game";
import { ROOM, wallsFor, FIXTURES, roomAt } from "./room";
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const RADIUS = 0.18;
export function blocked(x: number, y: number, unlocked = false) {
  return (
    !roomAt(x - 0.18, y - 0.18) ||
    !roomAt(x + 0.18, y + 0.18) ||
    wallsFor(unlocked).some((wall) => {
      const across = wall.axis === "x" ? x : y,
        along = wall.axis === "x" ? y : x;
      return (
        Math.abs(across - wall.position) < RADIUS + 0.025 &&
        along > wall.from - RADIUS &&
        along < wall.to + RADIUS
      );
    }) ||
    FIXTURES.some(
      (prop) =>
        x > prop.x - RADIUS &&
        x < prop.x + prop.width + RADIUS &&
        y > prop.y - RADIUS &&
        y < prop.y + prop.depth + RADIUS,
    )
  );
}
/** Resolve axes independently so actors slide along a wall. Return actual travel. */
export function move(
  actor: ActorState,
  dx: number,
  dy: number,
  unlocked = false,
) {
  const previous = { x: actor.x, y: actor.y };
  const x = clamp(actor.x + dx, 0.22, ROOM.width - 0.22);
  if (!blocked(x, actor.y, unlocked)) actor.x = x;
  const y = clamp(actor.y + dy, 0.22, ROOM.height - 0.22);
  if (!blocked(actor.x, y, unlocked)) actor.y = y;
  return Math.hypot(actor.x - previous.x, actor.y - previous.y);
}
