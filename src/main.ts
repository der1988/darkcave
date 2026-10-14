import "./style.css";
import { loadNativeGame, type ActorState } from "./native";
import { drawPerson } from "./player-sprite";

type Point = { x: number; y: number };
type SurfacePoint = [number, number, number];

const ISO_X = 32;
const ISO_Y = 16;
const ISO_Z = 32;
const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const ctx = canvas.getContext("2d", { alpha: false })!;
const game = await loadNativeGame();
const ROOM = game.room;
const keys = new Set<string>();

let width = 0;
let height = 0;
let offsetX = 0;
let offsetY = 0;
let torchAngle = -Math.PI / 4;
let torchRange = 4;
let torchOn = true;
let lastFrame = performance.now();

function project(x: number, y: number, z = 0): Point {
  return { x: (x - y) * ISO_X, y: (x + y) * ISO_Y - z * ISO_Z };
}

function screenToWorld(x: number, y: number): Point {
  return {
    x: x / (ISO_X * 2) + y / (ISO_Y * 2),
    y: y / (ISO_Y * 2) - x / (ISO_X * 2),
  };
}

function resize() {
  width = Math.max(320, Math.ceil(innerWidth / 2));
  height = Math.max(180, Math.ceil(innerHeight / 2));
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;
}

function traceSurface(points: SurfacePoint[]) {
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const p = project(x, y, z);
    if (index) ctx.lineTo(p.x + offsetX, p.y + offsetY);
    else ctx.moveTo(p.x + offsetX, p.y + offsetY);
  });
  ctx.closePath();
}

function flashlightPower() {
  const distance = Math.max(0, Math.min(1, (torchRange - 0.5) / 15.5));
  return 1.45 - distance * distance * 0.95;
}

function lightAt(point: Point) {
  if (!torchOn) return 0;
  const player = game.player();
  const dx = point.x - player.x;
  const dy = point.y - player.y;
  const distance = Math.hypot(dx, dy);
  if (distance > torchRange) return 0;
  const difference = Math.abs(
    Math.atan2(Math.sin(Math.atan2(dy, dx) - torchAngle), Math.cos(Math.atan2(dy, dx) - torchAngle)),
  );
  const lateral = Math.max(0, 1 - difference / 0.82);
  const edge = Math.min(1, Math.max(0, (torchRange - distance) / 0.35));
  return flashlightPower() * lateral * lateral * edge;
}

function drawSurface(
  points: SurfacePoint[],
  ambient: string,
  torchColor: [number, number, number],
  strength: number,
) {
  traceSurface(points);
  ctx.fillStyle = ambient;
  ctx.fill();

  ctx.save();
  traceSurface(points);
  ctx.clip();
  const player = game.player();
  const origin = project(player.x, player.y, 0.34);
  const ox = origin.x + offsetX;
  const oy = origin.y + offsetY;

  const ambientGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 155);
  ambientGlow.addColorStop(0, "rgba(42,48,49,.24)");
  ambientGlow.addColorStop(0.55, "rgba(30,35,37,.12)");
  ambientGlow.addColorStop(1, "rgba(16,19,21,0)");
  ctx.fillStyle = ambientGlow;
  ctx.fillRect(0, 0, width, height);

  if (torchOn) {
    const end = project(
      player.x + Math.cos(torchAngle) * torchRange,
      player.y + Math.sin(torchAngle) * torchRange,
    );
    const dx = end.x + offsetX - ox;
    const dy = end.y + offsetY - oy;
    const screenAngle = Math.atan2(dy, dx);
    const radius = Math.max(1, Math.hypot(dx, dy));
    const power = flashlightPower() * strength;

    for (let layer = 0; layer < 14; layer++) {
      const halfAngle = 0.86 - layer * 0.047;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, radius, screenAngle - halfAngle, screenAngle + halfAngle);
      ctx.closePath();
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
      const alpha = power * 0.074;
      glow.addColorStop(0, `rgba(${torchColor.join(",")},${alpha})`);
      glow.addColorStop(0.55, `rgba(${torchColor.join(",")},${alpha * 0.78})`);
      glow.addColorStop(0.87, `rgba(${torchColor.join(",")},${alpha * 0.34})`);
      glow.addColorStop(1, `rgba(${torchColor.join(",")},0)`);
      ctx.fillStyle = glow;
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRoom() {
  drawSurface(
    [[0, 0, 0], [ROOM.width, 0, 0], [ROOM.width, ROOM.height, 0], [0, ROOM.height, 0]],
    "#0b0d0e",
    [174, 166, 127],
    1,
  );

  const wallHeight = 1.35;
  drawSurface(
    [[0, 0, 0], [ROOM.width, 0, 0], [ROOM.width, 0, wallHeight], [0, 0, wallHeight]],
    "#101314",
    [184, 176, 137],
    0.82,
  );
  drawSurface(
    [[0, 0, 0], [0, ROOM.height, 0], [0, ROOM.height, wallHeight], [0, 0, wallHeight]],
    "#0e1112",
    [165, 159, 128],
    0.72,
  );
}

function drawBrotherShadow(brother: ActorState) {
  const illumination = lightAt(brother);
  if (illumination < 0.08) return;
  const player = game.player();
  const dx = brother.x - player.x;
  const dy = brother.y - player.y;
  const magnitude = Math.hypot(dx, dy) || 1;
  const ux = dx / magnitude;
  const uy = dy / magnitude;
  const px = -uy;
  const py = ux;
  const length = 0.55 + Math.min(1.1, illumination * 0.7);
  const width = 0.12;
  const points = [
    { x: brother.x + px * width, y: brother.y + py * width },
    { x: brother.x - px * width, y: brother.y - py * width },
    { x: brother.x + ux * length - px * 0.025, y: brother.y + uy * length - py * 0.025 },
    { x: brother.x + ux * (length + 0.12), y: brother.y + uy * (length + 0.12) },
    { x: brother.x + ux * length + px * 0.025, y: brother.y + uy * length + py * 0.025 },
  ];
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = project(point.x, point.y, 0.004);
    if (index) ctx.lineTo(screen.x + offsetX, screen.y + offsetY);
    else ctx.moveTo(screen.x + offsetX, screen.y + offsetY);
  });
  ctx.closePath();
  const base = project(brother.x, brother.y);
  const tip = project(brother.x + ux * length, brother.y + uy * length);
  const shadow = ctx.createLinearGradient(
    base.x + offsetX,
    base.y + offsetY,
    tip.x + offsetX,
    tip.y + offsetY,
  );
  shadow.addColorStop(0, "rgba(0,0,0,.48)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fill();
}

function drawActors(now: number) {
  const player = game.player();
  const brother = game.brother();
  const actors = [
    { actor: player, child: false, light: 0.58 + flashlightPower() * 0.24 },
    { actor: brother, child: true, light: 0.3 + lightAt(brother) * 0.65 },
  ].sort((a, b) => a.actor.x + a.actor.y - b.actor.x - b.actor.y);

  for (const { actor, child, light } of actors) {
    const screen = project(actor.x, actor.y);
    drawPerson(
      ctx,
      Math.round(screen.x + offsetX),
      Math.round(screen.y + offsetY),
      actor.heading,
      actor.stride,
      child,
      Math.min(1.15, light),
      now / 1000,
      actor.moving,
    );
  }
}

function update(dt: number) {
  const horizontal =
    Number(keys.has("d") || keys.has("arrowright")) -
    Number(keys.has("a") || keys.has("arrowleft"));
  const vertical =
    Number(keys.has("s") || keys.has("arrowdown")) -
    Number(keys.has("w") || keys.has("arrowup"));
  game.update(dt, horizontal, vertical, keys.has("shift"));
}

function render(now: number) {
  ctx.fillStyle = "#030506";
  ctx.fillRect(0, 0, width, height);
  const player = game.player();
  const center = project(player.x, player.y);
  offsetX = width / 2 - center.x;
  offsetY = height / 2 - center.y + 24;
  drawRoom();
  drawBrotherShadow(game.brother());
  drawActors(now);
}

function frame(now: number) {
  const dt = Math.min(0.04, (now - lastFrame) / 1000);
  lastFrame = now;
  update(dt);
  render(now);
  requestAnimationFrame(frame);
}

addEventListener("resize", resize);
addEventListener("blur", () => keys.clear());
addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key))
    event.preventDefault();
  if (key === " " && !event.repeat) torchOn = !torchOn;
  keys.add(key === "shift" ? "shift" : key);
});
addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const sx = ((event.clientX - rect.left) / rect.width) * width - width / 2;
  const sy = ((event.clientY - rect.top) / rect.height) * height - (height / 2 + 24);
  const target = screenToWorld(sx, sy);
  const distance = Math.hypot(target.x, target.y);
  if (distance > 0.04) {
    torchAngle = Math.atan2(target.y, target.x);
    torchRange = Math.max(0.4, Math.min(16, distance));
  }
});

resize();
requestAnimationFrame(frame);

if (import.meta.env.DEV)
  window.__liminal = {
    snapshot: () => ({
      player: game.player(),
      brother: game.brother(),
      torchOn,
      angle: torchAngle,
      lightRange: torchRange,
    }),
  };
