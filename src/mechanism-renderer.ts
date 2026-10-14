import { COMPUTER, MEMORY, EXIT } from "./room";
import type { Game } from "./game";
import type { Flashlight } from "./lighting";
import { project, type Point } from "./geometry";
export function drawMechanisms(
  ctx: CanvasRenderingContext2D,
  camera: Point,
  game: Game,
  torch: Flashlight,
  width: number,
  height: number,
) {
  const progress = game.progress(),
    screen = project(COMPUTER.x, COMPUTER.y, 0.53),
    exit = project(EXIT.x, 0, 0.8);
  ctx.save();
  ctx.fillStyle = progress.doorOpen ? "#548576" : "#657e93";
  ctx.fillRect(
    Math.round(screen.x + camera.x - 4),
    Math.round(screen.y + camera.y - 4),
    8,
    6,
  );
  ctx.fillStyle = "#182e2b";
  ctx.fillRect(
    Math.round(screen.x + camera.x - 3),
    Math.round(screen.y + camera.y - 3),
    5,
    3,
  );
  ctx.fillStyle = "#3d4b41";
  ctx.fillRect(
    Math.round(exit.x + camera.x - 9),
    Math.round(exit.y + camera.y - 9),
    18,
    10,
  );
  ctx.fillStyle = "#98a28c";
  ctx.font = "5px monospace";
  ctx.fillText(
    "USCITA",
    Math.round(exit.x + camera.x - 9),
    Math.round(exit.y + camera.y - 2),
  );
  if (!progress.memoryCollected) {
    const p = project(MEMORY.x, MEMORY.y, 0.07);
    ctx.fillStyle = "#976f62";
    ctx.fillRect(
      Math.round(p.x + camera.x - 3),
      Math.round(p.y + camera.y - 3),
      6,
      4,
    );
  }
  const nearComputer =
    Math.hypot(game.player().x - COMPUTER.x, game.player().y - COMPUTER.y) <
    1.25;
  const hint =
    progress.doorOpen && nearComputer
      ? "Passaggio verso il ricordo aperto"
      : game.interactionHint();
  ctx.font = "8px monospace";
  ctx.textAlign = "center";
  if (hint) {
    ctx.fillStyle = "#c0c6b6";
    ctx.fillText(hint, width / 2, height - 32);
  }
  if (progress.finished) {
    ctx.fillStyle = "rgba(5,9,8,.8)";
    ctx.fillRect(width / 2 - 80, 18, 160, 24);
    ctx.fillStyle = "#c0c6b6";
    ctx.fillText("Uscita raggiunta", width / 2, 33);
  }
  ctx.restore();
}
