import type { Game } from "./game";
import { project, type Point } from "./geometry";
import type { Flashlight } from "./lighting";
import { illumination } from "./lighting";
import { actorOpacity } from "./actor-renderer";

export function drawThrowables(
  ctx: CanvasRenderingContext2D,
  camera: Point,
  game: Game,
  torch: Flashlight,
) {
  const player = game.player();
  for (const item of game.objects()) {
    if (item.state === "held") continue;
    if (actorOpacity(item) < 1) continue;
    const screen = project(item.x, item.y, item.z),
      x = Math.round(screen.x + camera.x),
      y = Math.round(screen.y + camera.y);
    const light = illumination({ ...item, z: item.z + 0.03 }, player, torch);
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.35 + light * 0.6);
    if (item.state === "broken") {
      ctx.fillStyle = "#65877d";
      for (const [dx, dy] of [
        [-3, 0],
        [1, -2],
        [3, 1],
        [-1, 2],
      ])
        ctx.fillRect(x + dx, y + dy, 1, 1);
    } else if (item.kind === "bottle") {
      ctx.fillStyle = "#6f9886";
      ctx.fillRect(x - 2, y - 5, 4, 5);
      ctx.fillRect(x - 1, y - 8, 2, 3);
      ctx.fillStyle = "#a4b6a4";
      ctx.fillRect(x - 1, y - 4, 1, 3);
    } else {
      ctx.fillStyle = "#a6a295";
      ctx.fillRect(x - 2, y - 2, 4, 2);
      ctx.fillStyle = "#73766d";
      ctx.fillRect(x - 1, y, 3, 1);
    }
    ctx.restore();
  }
}
export function drawHeldObject(
  ctx: CanvasRenderingContext2D,
  camera: Point,
  game: Game,
) {
  const item = game.heldObject();
  if (!item) return;
  const player = game.player(),
    p = project(player.x, player.y, 0.27),
    x = Math.round(p.x + camera.x - 5),
    y = Math.round(p.y + camera.y);
  ctx.save();
  ctx.globalAlpha = actorOpacity(player);
  ctx.fillStyle = item.kind === "bottle" ? "#6f9886" : "#aaa393";
  ctx.fillRect(
    x,
    y,
    item.kind === "bottle" ? 3 : 3,
    item.kind === "bottle" ? 5 : 2,
  );
  if (item.kind === "bottle") ctx.fillRect(x + 1, y - 2, 1, 2);
  const power = game.chargePower();
  if (power !== null) {
    ctx.fillStyle = "#151a18";
    ctx.fillRect(x - 2, y + 10, 23, 4);
    ctx.fillStyle = "#b6b29a";
    ctx.fillRect(x - 1, y + 11, Math.round(21 * power), 2);
  }
  ctx.restore();
}
