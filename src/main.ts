import "./style.css";
import { Companion } from "./companion";
import { beam, MAX_LIGHT_RANGE, MIN_LIGHT_RANGE, type Lamp } from "./light";
import { movementSpeed, movementVector } from "./movement";
import { drawPerson } from "./player-sprite";
import {
  BROTHER_START,
  PLAYER_START,
  ROOM,
  move,
  project,
  screenToWorld,
  type Point,
} from "./world";

const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const ctx = canvas.getContext("2d", { alpha: false })!;
ctx.imageSmoothingEnabled = false;

const player = { ...PLAYER_START };
const brother = new Companion(BROTHER_START);
const keys = new Set<string>();
let width = 0;
let height = 0;
let offsetX = 0;
let offsetY = 0;
let angle = -Math.PI / 2;
let lightRange = 4;
let torchOn = true;
let playerHeading = angle;
let playerStride = 0;
let playerMoving = false;
let last = performance.now();

function resize() {
  width = Math.max(320, Math.ceil(innerWidth / 2));
  height = Math.max(180, Math.ceil(innerHeight / 2));
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;
}

function lamp(): Lamp {
  return { ...player, angle, range: lightRange, on: torchOn };
}

type SurfacePoint = [number, number, number];

function traceSurface(points: SurfacePoint[]) {
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const p = project(x, y, z);
    if (index) ctx.lineTo(p.x + offsetX, p.y + offsetY);
    else ctx.moveTo(p.x + offsetX, p.y + offsetY);
  });
  ctx.closePath();
}

function drawLitSurface(
  points: SurfacePoint[],
  color: [number, number, number],
  surfaceStrength: number,
) {
  traceSurface(points);
  ctx.fillStyle = "#000";
  ctx.fill();
  if (!torchOn) return;

  ctx.save();
  traceSurface(points);
  ctx.clip();

  const origin = project(player.x, player.y, 0.36);
  const end = project(
    player.x + Math.cos(angle) * lightRange,
    player.y + Math.sin(angle) * lightRange,
  );
  const ox = origin.x + offsetX;
  const oy = origin.y + offsetY;
  const dx = end.x + offsetX - ox;
  const dy = end.y + offsetY - oy;
  const screenAngle = Math.atan2(dy, dx);
  const radius = Math.max(1, Math.hypot(dx, dy));
  const targetPower =
    (1 - Math.min(1, Math.max(0, (lightRange - 1.2) / 16.8)) * 0.48) *
    surfaceStrength;

  for (let layer = 0; layer < 12; layer++) {
    const halfAngle = 0.76 - layer * 0.047;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, radius, screenAngle - halfAngle, screenAngle + halfAngle);
    ctx.closePath();
    const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
    const alpha = targetPower * 0.085;
    gradient.addColorStop(0, `rgba(${color.join(",")},${alpha})`);
    gradient.addColorStop(0.62, `rgba(${color.join(",")},${alpha * 0.78})`);
    gradient.addColorStop(0.9, `rgba(${color.join(",")},${alpha * 0.35})`);
    gradient.addColorStop(1, `rgba(${color.join(",")},0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  ctx.restore();
}

function drawFloor() {
  drawLitSurface(
    [
      [ROOM.x, ROOM.y, 0],
      [ROOM.x + ROOM.w, ROOM.y, 0],
      [ROOM.x + ROOM.w, ROOM.y + ROOM.h, 0],
      [ROOM.x, ROOM.y + ROOM.h, 0],
    ],
    [112, 107, 84],
    1,
  );
}

function drawWalls() {
  const h = 1.3;
  drawLitSurface(
    [[0, 0, 0], [ROOM.w, 0, 0], [ROOM.w, 0, h], [0, 0, h]],
    [134, 127, 98],
    0.78,
  );
  drawLitSurface(
    [[0, ROOM.h, 0], [ROOM.w, ROOM.h, 0], [ROOM.w, ROOM.h, h], [0, ROOM.h, h]],
    [120, 115, 91],
    0.67,
  );
  drawLitSurface(
    [[0, 0, 0], [0, ROOM.h, 0], [0, ROOM.h, h], [0, 0, h]],
    [126, 120, 94],
    0.72,
  );
  drawLitSurface(
    [[ROOM.w, 0, 0], [ROOM.w, ROOM.h, 0], [ROOM.w, ROOM.h, h], [ROOM.w, 0, h]],
    [126, 120, 94],
    0.72,
  );
}

function characterLight(p: Point) {
  return Math.max(0.12, beam(lamp(), p, 0.45));
}

function drawCharacters() {
  const figures = [
    { p: player, child: false, heading: playerHeading, stride: playerStride },
    {
      p: brother.position,
      child: true,
      heading: brother.heading,
      stride: brother.stride,
    },
  ].sort((a, b) => a.p.x + a.p.y - (b.p.x + b.p.y));
  for (const figure of figures) {
    const screen = project(figure.p.x, figure.p.y);
    drawPerson(
      ctx,
      Math.round(screen.x + offsetX),
      Math.round(screen.y + offsetY),
      figure.heading,
      figure.stride,
      figure.child,
      characterLight(figure.p),
      performance.now() / 1000,
      figure.child ? brother.moving : playerMoving,
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
  const direction = movementVector(horizontal, vertical);
  const running = keys.has("shift");
  playerMoving = false;
  if (direction.x || direction.y) {
    const speed = movementSpeed(running);
    const before = { ...player };
    move(player, direction.x * speed * dt, direction.y * speed * dt);
    const travelled = Math.hypot(player.x - before.x, player.y - before.y);
    if (travelled) {
      playerHeading = Math.atan2(direction.y, direction.x);
      playerStride += travelled * 8;
      playerMoving = true;
    }
  }
  brother.update(dt, player, running);
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  const center = project(player.x, player.y);
  offsetX = width / 2 - center.x;
  offsetY = height / 2 - center.y + 20;
  drawFloor();
  drawWalls();
  drawCharacters();
}

function frame(now: number) {
  const dt = Math.min(0.04, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

addEventListener("resize", resize);
addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      " ",
    ].includes(key)
  )
    event.preventDefault();
  if (key === " " && !event.repeat) torchOn = !torchOn;
  keys.add(key === "shift" ? "shift" : key);
});
addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const sx = ((event.clientX - rect.left) / rect.width) * width - width / 2;
  const sy =
    ((event.clientY - rect.top) / rect.height) * height - (height / 2 + 20);
  const world = screenToWorld(sx, sy);
  const cursorDistance = Math.hypot(world.x, world.y);
  if (cursorDistance > 0.05) {
    angle = Math.atan2(world.y, world.x);
    lightRange = Math.max(
      MIN_LIGHT_RANGE,
      Math.min(MAX_LIGHT_RANGE, cursorDistance),
    );
  }
});
canvas.addEventListener("pointerdown", () => canvas.focus());

resize();
requestAnimationFrame(frame);

if (import.meta.env.DEV)
  window.__liminal = {
    snapshot: () => ({
      player: { ...player },
      brother: { ...brother.position },
      torchOn,
      angle,
      lightRange,
    }),
    place: (p: Point) => Object.assign(player, p),
  };
