import { project } from "./world";

function directionFrame(angle: number) {
  const p = project(Math.cos(angle), Math.sin(angle));
  return (Math.round(Math.atan2(p.y, p.x) / (Math.PI / 4)) + 8) % 8;
}

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  stride: number,
  child: boolean,
  brightness: number,
  time: number,
  moving: boolean,
) {
  const frame = directionFrame(heading);
  const back = frame >= 5;
  const profile = frame === 0 || frame === 4;
  const side = frame === 3 || frame === 4 || frame === 5 ? -1 : 1;
  const scale = child ? 0.76 : 1;
  const step = moving ? Math.sin(Math.round(stride * 3) / 3) : 0;
  const bob = moving ? Math.round(Math.abs(step)) : 0;
  const breathe = !moving && Math.sin(time * 1.7) > 0.82 ? 1 : 0;
  const shade = (tone: number, cool = 1) => {
    const light = Math.max(0.12, brightness);
    return `rgb(${Math.round(tone * light)},${Math.round(tone * cool * light)},${Math.round(tone * 0.76 * light)})`;
  };
  const rect = (
    dx: number,
    dy: number,
    w: number,
    h: number,
    tone: number,
    cool = 0.95,
  ) => {
    ctx.fillStyle = shade(tone, cool);
    ctx.fillRect(
      Math.round(x + dx * scale),
      Math.round(y + (dy - bob + (dy < -8 ? breathe : 0)) * scale),
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(h * scale)),
    );
  };

  ctx.fillStyle = "rgba(0,0,0,.58)";
  ctx.fillRect(Math.round(x - 4 * scale), y, Math.max(2, Math.round(8 * scale)), 1);

  const legSwing = Math.round(step * 1.4);
  rect(-2 + legSwing, -7, 2, 6 + legSwing, child ? 142 : 132, 0.9);
  rect(1 - legSwing, -7, 2, 6 - legSwing, child ? 155 : 146, 1);
  rect(-2 + legSwing, -1, 2, 1, 100, 0.82);
  rect(1 - legSwing, -1, 2, 1, 100, 0.82);

  const torsoWidth = profile ? 4 : 6;
  rect(-Math.floor(torsoWidth / 2), -14, torsoWidth, 7, child ? 145 : 128, 0.88);
  rect(-Math.floor(torsoWidth / 2), -14, torsoWidth, 1, child ? 164 : 150, 1);
  rect(-1, -8, 3, 2, child ? 132 : 118, 0.88);

  const armSwing = Math.round(step);
  rect(side > 0 ? -4 : 3, -12 + armSwing, 1, 5 - armSwing, child ? 165 : 150, 0.92);
  rect(side > 0 ? 3 : -4, -12 - armSwing, 1, 5 + armSwing, child ? 158 : 143, 0.9);
  rect(side > 0 ? -4 : 3, -7 + armSwing, 1, 1, 185, 0.96);

  const headOffset = [1, 1, 0, -1, -1, -1, 0, 1][frame];
  const headWidth = profile ? 3 : 4;
  rect(-2 + headOffset, -20, headWidth, 4, child ? 198 : 184, 0.9);
  rect(-2 + headOffset, -20, headWidth, 1, child ? 105 : 92, 0.82);
  rect(-2 + headOffset, -19, headWidth, 1, child ? 178 : 162, 0.9);
  if (back) rect(-2 + headOffset, -18, headWidth, 2, child ? 112 : 98, 0.84);
  else if (profile) rect(side > 0 ? 1 + headOffset : -2 + headOffset, -18, 1, 1, 210, 0.96);

  if (!child) {
    rect(-3, -15, 1, 6, 110, 0.78);
    rect(2, -15, 1, 6, 116, 0.8);
    rect(side > 0 ? 3 : -5, -11, 2, 1, 205, 0.92);
    ctx.fillStyle = brightness > 0.3 ? "#c8bb78" : "#15140c";
    ctx.fillRect(
      Math.round(x + (side > 0 ? 5 : -6) * scale),
      Math.round(y - (11 + bob) * scale),
      Math.max(1, Math.round(2 * scale)),
      1,
    );
  } else {
    rect(-1, -15, 2, 1, 185, 0.94);
    rect(-3, -13, 1, 4, 145, 0.86);
  }
}
