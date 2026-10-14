import { ROOM, DOORS } from "./room";
import { clamp, move } from "./movement";
export type ActorState = {
  x: number;
  y: number;
  heading: number;
  stride: number;
  moving: boolean;
  stealth: boolean;
};
export type Game = {
  room: { width: number; height: number };
  update(
    dt: number,
    horizontal: number,
    vertical: number,
    stealth: boolean,
  ): void;
  player(): ActorState;
  brother(): ActorState;
};
function actor(x: number, y: number): ActorState {
  return {
    x,
    y,
    heading: -Math.PI / 4,
    stride: 0,
    moving: false,
    stealth: false,
  };
}
function walk(
  actor: ActorState,
  targetX: number,
  targetY: number,
  distance: number,
) {
  const dx = targetX - actor.x,
    dy = targetY - actor.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return;
  const travel = move(
    actor,
    (dx / length) * distance,
    (dy / length) * distance,
  );
  actor.heading = Math.atan2(dy, dx);
  actor.stride += travel * 8;
  actor.moving = travel > 0.001;
}
/** Route the companion through the nearest separating doorway before following directly. */
function followTarget(brother: ActorState, player: ActorState) {
  const door = DOORS.filter(
    (door) => brother.x < door.x !== player.x < door.x,
  ).sort((a, b) => Math.abs(a.x - brother.x) - Math.abs(b.x - brother.x))[0];
  if (!door) return player;
  if (Math.abs(brother.y - door.y) > 0.12) return { x: brother.x, y: door.y };
  return { x: door.x + Math.sign(player.x - brother.x) * 0.35, y: door.y };
}
export function createGame(): Game {
  const player = actor(1.9, 1.55),
    brother = actor(1.48, 1.78);
  return {
    room: ROOM,
    update(dt, horizontal, vertical, stealth) {
      dt = clamp(dt, 0, 0.04);
      player.moving = brother.moving = false;
      player.stealth = brother.stealth = stealth;
      const dx = horizontal + vertical,
        dy = -horizontal + vertical;
      if (Math.hypot(dx, dy) > 0.001)
        walk(
          player,
          player.x + dx,
          player.y + dy,
          (stealth ? 1.15 : 2.05) * dt,
        );
      const gap = Math.hypot(player.x - brother.x, player.y - brother.y);
      if (gap > 0.5) {
        const target = followTarget(brother, player);
        walk(
          brother,
          target.x,
          target.y,
          Math.min(gap - 0.5, (stealth ? 1.25 : 2.3) * dt),
        );
      }
    },
    player: () => ({ ...player }),
    brother: () => ({ ...brother }),
  };
}
