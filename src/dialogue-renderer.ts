import type { Game } from "./game";
import { project, type Point } from "./geometry";

/** A small world-anchored bubble follows the current speaker every frame. */
export function drawDialogue(
  ctx: CanvasRenderingContext2D,
  camera: Point,
  game: Game,
  width: number,
) {
  const line = game.dialogue();
  if (!line) return;
  const actor = line.speaker === "player" ? game.player() : game.brother();
  const anchor = project(actor.x, actor.y, 0.78);
  ctx.save();
  ctx.font = "7px monospace";
  ctx.textBaseline = "top";
  const words = line.text.split(" "),
    lines: string[] = [];
  let text = "";
  for (const word of words) {
    const next = text ? `${text} ${word}` : word;
    if (ctx.measureText(next).width > 140 && text) {
      lines.push(text);
      text = word;
    } else text = next;
  }
  if (text) lines.push(text);
  const w = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 12,
    h = lines.length * 10 + 10;
  const x = Math.max(
      4,
      Math.min(width - w - 4, Math.round(anchor.x + camera.x - w / 2)),
    ),
    y = Math.round(anchor.y + camera.y - h - 5);
  ctx.fillStyle = "rgba(8,12,11,.9)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = line.speaker === "player" ? "#526d6d" : "#747359";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#c4c5b3";
  lines.forEach((line, index) => ctx.fillText(line, x + 6, y + 5 + index * 10));
  ctx.restore();
}
