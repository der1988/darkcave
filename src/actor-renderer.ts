import type { Game } from "./game";
import { project, type Point } from "./geometry";
import { illumination, type Flashlight } from "./lighting";
import { WALLS, ROOM } from "./room";
import { drawPerson } from "./player-sprite";

/** Intersect the isometric camera ray with a vertical wall at torso height. */
export function actorOpacity(actor: Point) {
  for (const wall of WALLS) {
    const across = wall.axis === "x" ? actor.x : actor.y;
    const along = wall.axis === "x" ? actor.y : actor.x;
    const distance = wall.position - across;
    if (distance <= 0.01) continue;
    const hitAlong = along + distance;
    const hitHeight = 0.3 + distance;
    if (
      hitHeight < ROOM.wallHeight &&
      hitAlong >= wall.from &&
      hitAlong <= wall.to
    )
      return 0.48;
  }
  return 1;
}

export function drawActors(
  ctx: CanvasRenderingContext2D,
  camera: Point,
  game: Game,
  torch: Flashlight,
  now: number,
) {
  const player = game.player();
  const actors = [
    { actor: player, child: false },
    { actor: game.brother(), child: true },
  ];
  actors.sort((a, b) => a.actor.x + a.actor.y - b.actor.x - b.actor.y);
  for (const { actor, child } of actors) {
    const p = project(actor.x, actor.y);
    const origin = torch.origin(player),
      lens = project(origin.x, origin.y, origin.z);
    const light = illumination({ ...actor, z: 0.3 }, player, torch);
    drawPerson(
      ctx,
      Math.round(p.x + camera.x),
      Math.round(p.y + camera.y),
      actor.heading,
      actor.stride,
      child,
      Math.min(1.2, 0.3 + light * 0.65),
      now / 1000,
      actor.moving,
      !child ? { x: lens.x + camera.x, y: lens.y + camera.y } : undefined,
      child ? 0 : 1,
      actor.stealth,
      actorOpacity(actor),
    );
  }
}

/** The creature is readable only where the torch reaches it, never through a wall. */
export function drawClicker(
  ctx: CanvasRenderingContext2D,
  camera: Point,
  game: Game,
  torch: Flashlight,
) {
  const actor = game.clicker(),
    light = torch.at({ ...actor, z: 0.3 }, game.player());
  if (light < 0.05 || actorOpacity(actor) < 1) return;
  const p = project(actor.x, actor.y),
    x = Math.round(p.x + camera.x),
    y = Math.round(p.y + camera.y),
    step = actor.moving ? Math.round(Math.sin(actor.stride) * 2) : 0;
  ctx.save();
  ctx.globalAlpha = Math.min(1, light * 1.7);
  ctx.fillStyle = "#342d28";
  ctx.fillRect(x - 4, y - 12, 7, 9);
  ctx.fillRect(x - 3 + step, y - 5, 2, 5);
  ctx.fillRect(x + 2 - step, y - 5, 2, 5);
  ctx.fillStyle = "#71675a";
  ctx.fillRect(x - 5, y - 21, 9, 8);
  ctx.fillRect(x - 7, y - 19, 3, 4);
  ctx.fillRect(x + 3, y - 18, 3, 5);
  ctx.fillStyle = "#a39173";
  ctx.fillRect(x - 4, y - 22, 3, 4);
  ctx.fillRect(x + 1, y - 20, 3, 3);
  ctx.fillStyle = "#4c4035";
  ctx.fillRect(x - 6, y - 12, 2, 8);
  ctx.fillRect(x + 3, y - 12, 2, 8);
  ctx.restore();
}
