function directionFrame(angle: number) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const screenAngle = Math.atan2((cosine + sine) * 0.5, cosine - sine);
  return (Math.round(screenAngle / (Math.PI / 4)) + 8) % 8;
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
  lens?: { x: number; y: number },
  torchAmount = 0,
  stealth = false,
  opacity = 1,
) {
  const frame = directionFrame(heading);
  const back = frame >= 5;
  const profile = frame === 0 || frame === 4;
  const side = frame === 3 || frame === 4 || frame === 5 ? -1 : 1;
  const scale = child ? 0.76 : 1;
  const step = moving ? Math.sin(Math.round(stride * 3) / 3) : 0;
  const bob = moving ? Math.round(Math.abs(step)) : 0;
  const breathe = !moving && Math.sin(time * 1.7) > 0.82 ? 1 : 0;
  const crouch = stealth ? 3 : 0;
  type Color = [number, number, number];
  const palette = child
    ? {
        trousers: [91, 75, 57] as Color,
        trousersLight: [116, 94, 68] as Color,
        coat: [72, 98, 73] as Color,
        coatLight: [99, 123, 91] as Color,
        skin: [194, 145, 108] as Color,
        skinShade: [165, 112, 82] as Color,
        hair: [68, 45, 31] as Color,
        accent: [151, 79, 55] as Color,
      }
    : {
        trousers: [55, 63, 73] as Color,
        trousersLight: [73, 82, 92] as Color,
        coat: [46, 78, 87] as Color,
        coatLight: [65, 102, 107] as Color,
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

  ctx.save();
  ctx.globalAlpha=opacity;
  ctx.fillStyle = "rgba(0,0,0,.58)";
  ctx.fillRect(Math.round(x - 4 * scale), y, Math.max(2, Math.round(8 * scale)), 1);

  const legSwing = Math.round(step * 1.4);
  rect(-2 + legSwing, -7, 2, 6 + legSwing, palette.trousers);
  rect(1 - legSwing, -7, 2, 6 - legSwing, palette.trousersLight);
  rect(-2 + legSwing, -1, 2, 1, palette.hair);
  rect(1 - legSwing, -1, 2, 1, palette.hair);

  const torsoWidth = profile ? 4 : 6;
  rect(-Math.floor(torsoWidth / 2)+(stealth?side:0), -14+crouch, torsoWidth, 7, palette.coat);
  rect(-Math.floor(torsoWidth / 2)+(stealth?side:0), -14+crouch, torsoWidth, 1, palette.coatLight);
  rect(-1, -8+crouch, 3, 2, palette.coat);

  const armSwing = Math.round(step);
  rect(side > 0 ? -4 : 3, -12 + armSwing+crouch, 1, 5 - armSwing, palette.coatLight);
  rect(side > 0 ? 3 : -4, -12 - armSwing+crouch, 1, 5 + armSwing, palette.coat);
  rect(side > 0 ? -4 : 3, -7 + armSwing, 1, 1, palette.skin);

  const headOffset = [1, 1, 0, -1, -1, -1, 0, 1][frame];
  const headWidth = profile ? 3 : 4;
  rect(-2 + headOffset+(stealth?side:0), -20+crouch, headWidth, 4, palette.skin);
  rect(-2 + headOffset+(stealth?side:0), -20+crouch, headWidth, 1, palette.hair);
  rect(-2 + headOffset+(stealth?side:0), -19+crouch, headWidth, 1, palette.skinShade);
  if (back) rect(-2 + headOffset+(stealth?side:0), -18+crouch, headWidth, 2, palette.hair);
  else if (profile)
    rect((side > 0 ? 1 + headOffset : -2 + headOffset)+(stealth?side:0), -18+crouch, 1, 1, [213, 190, 145]);

  if (!child) {
    rect(-3+(stealth?side:0), -15+crouch, 1, 6, palette.accent);
    rect(2+(stealth?side:0), -15+crouch, 1, 6, palette.accent);
    const armLift = Math.round(torchAmount * 3);
    rect(side > 0 ? 3 : -5, -8 - armLift+crouch, 2, 1, palette.skin);
    if (lens && torchAmount > 0.02) {
      const handX = Math.round(x + (side > 0 ? 4 : -4) * scale);
      const handY = Math.round(y - (8 + armLift + bob-crouch) * scale);
      ctx.strokeStyle = "#242728";
      ctx.lineWidth = Math.max(1, Math.round(scale));
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(Math.round(lens.x), Math.round(lens.y));
      ctx.stroke();
      ctx.fillStyle = "#e6ce73";
      ctx.fillRect(Math.round(lens.x) - 1, Math.round(lens.y), 2, 1);
    }
  } else {
    rect(-1, -15, 2, 1, palette.accent);
    rect(-3, -13, 1, 4, palette.accent);
  }
  ctx.restore();
}
