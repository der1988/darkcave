import { project } from "./world";

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  stride: number,
  child: boolean,
  brightness: number,
) {
  const direction = project(Math.cos(heading), Math.sin(heading));
  const side = direction.x < 0 ? -1 : 1;
  const phase = Math.sin(stride);
  const scale = child ? 0.72 : 1;
  const tone = (n: number) => Math.round(n * Math.max(0.12, brightness));
  const color = (n: number) =>
    `rgb(${tone(n)},${tone(n * 0.95)},${tone(n * 0.8)})`;
  const rect = (dx: number, dy: number, w: number, h: number, n: number) => {
    ctx.fillStyle = color(n);
    ctx.fillRect(
      Math.round(x + dx * scale),
      Math.round(y + dy * scale),
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(h * scale)),
    );
  };

  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(Math.round(x - 4 * scale), y, Math.round(8 * scale), 1);
  rect(-2 + phase, -6, 2, 6, child ? 135 : 125);
  rect(1 - phase, -6, 2, 6, child ? 142 : 132);
  rect(-3, -13, 6, 7, child ? 145 : 120);
  rect(-4 + side, -12, 1, 6, child ? 155 : 145);
  rect(3 + side, -12, 1, 6, child ? 155 : 145);
  rect(-2 + side, -17, 4, 4, child ? 178 : 165);
  rect(-2 + side, -17, 4, 1, child ? 80 : 72);
}
