import { Throwables, type Throwable, type SoundEvent } from "./throwables";
import { Clicker, type ClickerState, type Footstep } from "./clicker";
import { Dialogue, type DialogueLine } from "./dialogue";
import { ROOM, DOORS, roomAt } from "./room";
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
  clicker(): ClickerState;
  dialogue(): DialogueLine | null;
  takeFootsteps(): Footstep[];
  objects(): Throwable[];
  heldObject(): Throwable | null;
  chargePower(): number | null;
  pickUp(id: string): boolean;
  beginThrow(): void;
  releaseThrow(angle: number): boolean;
  cancelThrow(): void;
  takeImpacts(): SoundEvent[];
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
/** Breadth-first room routing keeps the companion following through either wall axis. */
function followTarget(brother: ActorState, player: ActorState) {
  const start = roomAt(brother.x, brother.y).id,
    goal = roomAt(player.x, player.y).id;
  if (start === goal) return player;
  const queue = [{ id: start, path: [] as typeof DOORS }];
  const visited = new Set([start]);
  for (const entry of queue) {
    if (entry.id === goal) {
      const door = entry.path[0];
      if (door.axis === "x") {
        if (Math.abs(brother.y - door.y) > 0.1)
          return { x: brother.x, y: door.y };
        return { x: door.x + Math.sign(door.x - brother.x) * 0.35, y: door.y };
      }
      if (Math.abs(brother.x - door.x) > 0.1)
        return { x: door.x, y: brother.y };
      return { x: door.x, y: door.y + Math.sign(door.y - brother.y) * 0.35 };
    }
    for (const door of DOORS.filter((door) => door.rooms.includes(entry.id))) {
      const next = door.rooms.find((id) => id !== entry.id)!;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, path: [...entry.path, door] });
      }
    }
  }
  return player;
}
export function createGame(): Game {
  const player = actor(1.9, 1.55),
    brother = actor(1.48, 1.78);
  const clicker = new Clicker(),
    dialogue = new Dialogue();
  const footsteps: Footstep[] = [];
  const objects = new Throwables();
  const impacts: SoundEvent[] = [];
  const travel = { player: 0, brother: 0 };
  return {
    room: ROOM,
    update(dt, horizontal, vertical, stealth) {
      dt = clamp(dt, 0, 0.04);
      const beforePlayer = { ...player },
        beforeBrother = { ...brother };
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
      for (const [source, actor, before] of [
        ["player", player, beforePlayer],
        ["brother", brother, beforeBrother],
      ] as const) {
        if (stealth) {
          travel[source] = 0;
          continue;
        }
        travel[source] += Math.hypot(actor.x - before.x, actor.y - before.y);
        if (travel[source] >= 0.48) {
          travel[source] %= 0.48;
          const step = { x: actor.x, y: actor.y, source };
          footsteps.push(step);
          clicker.hear(step);
          if (footsteps.length > 24) footsteps.shift();
        }
      }
      for (const sound of objects.update(dt, player)) {
        clicker.hear(sound);
        impacts.push(sound);
        if (impacts.length > 24) impacts.shift();
      }
      clicker.update(dt);
      dialogue.update(dt, stealth);
    },
    objects: () => objects.snapshot(),
    heldObject: () => {
      const held = objects.held();
      return held ? { ...held } : null;
    },
    chargePower: () => objects.power(),
    pickUp: (id) => objects.pickUp(id, player),
    beginThrow: () => objects.beginCharge(),
    releaseThrow: (angle) => objects.release(player, angle),
    cancelThrow: () => objects.cancelCharge(),
    takeImpacts: () => impacts.splice(0),
    clicker: () => clicker.snapshot(),
    dialogue: () => dialogue.snapshot(),
    takeFootsteps: () => footsteps.splice(0),
    player: () => ({ ...player }),
    brother: () => ({ ...brother }),
  };
}
