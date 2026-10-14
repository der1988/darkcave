import type { Game } from "./game";
import { project, type Point } from "./geometry";
import { illumination, type Flashlight } from "./lighting";
import { drawPerson } from "./player-sprite";

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
    );
  }
}
