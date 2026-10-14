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
  type Color = [number, number, number];
  const palette = child
    ? {
        trousers: [104, 81, 51] as Color,
        trousersLight: [128, 99, 62] as Color,
        coat: [80, 105, 70] as Color,
        coatLight: [109, 132, 83] as Color,
        skin: [194, 145, 108] as Color,
        skinShade: [165, 112, 82] as Color,
        hair: [68, 45, 31] as Color,
        accent: [151, 79, 55] as Color,
      }
    : {
        trousers: [55, 65, 78] as Color,
        trousersLight: [72, 82, 96] as Color,
        coat: [45, 83, 94] as Color,
        coatLight: [63, 109, 116] as Color,
        skin: [183, 132, 101] as Color,
        skinShade: [151, 99, 76] as Color,
        hair: [57, 40, 35] as Color,
        accent: [135, 70, 48] as Color,
      };
  const shade = (color: Color) => {
    const light = Math.max(0.16, brightness);
    return `rgb(${color.map((channel) => Math.min(255, Math.round(channel * light))).join(",")})`;
  };
  const rect = (
    dx: number,
    dy: number,
    w: number,
    h: number,
    color: Color,
  ) => {
    ctx.fillStyle = shade(color);
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
  rect(-2 + legSwing, -7, 2, 6 + legSwing, palette.trousers);
  rect(1 - legSwing, -7, 2, 6 - legSwing, palette.trousersLight);
  rect(-2 + legSwing, -1, 2, 1, palette.hair);
  rect(1 - legSwing, -1, 2, 1, palette.hair);

  const torsoWidth = profile ? 4 : 6;
  rect(-Math.floor(torsoWidth / 2), -14, torsoWidth, 7, palette.coat);
  rect(-Math.floor(torsoWidth / 2), -14, torsoWidth, 1, palette.coatLight);
  rect(-1, -8, 3, 2, palette.coat);

  const armSwing = Math.round(step);
  rect(side > 0 ? -4 : 3, -12 + armSwing, 1, 5 - armSwing, palette.coatLight);
  rect(side > 0 ? 3 : -4, -12 - armSwing, 1, 5 + armSwing, palette.coat);
  rect(side > 0 ? -4 : 3, -7 + armSwing, 1, 1, palette.skin);

  const headOffset = [1, 1, 0, -1, -1, -1, 0, 1][frame];
  const headWidth = profile ? 3 : 4;
  rect(-2 + headOffset, -20, headWidth, 4, palette.skin);
  rect(-2 + headOffset, -20, headWidth, 1, palette.hair);
  rect(-2 + headOffset, -19, headWidth, 1, palette.skinShade);
  if (back) rect(-2 + headOffset, -18, headWidth, 2, palette.hair);
  else if (profile)
    rect(side > 0 ? 1 + headOffset : -2 + headOffset, -18, 1, 1, [213, 190, 145]);

  if (!child) {
    rect(-3, -15, 1, 6, palette.accent);
    rect(2, -15, 1, 6, palette.accent);
    rect(side > 0 ? 3 : -5, -11, 2, 1, palette.skin);
    ctx.fillStyle = brightness > 0.3 ? "#c8bb78" : "#15140c";
    ctx.fillRect(
      Math.round(x + (side > 0 ? 5 : -6) * scale),
      Math.round(y - (11 + bob) * scale),
      Math.max(1, Math.round(2 * scale)),
      1,
    );
  } else {
    rect(-1, -15, 2, 1, palette.accent);
    rect(-3, -13, 1, 4, palette.accent);
  }
}
