import "./style.css";
import { Companion } from "./companion";
import { beam, MAX_LIGHT_RANGE, MIN_LIGHT_RANGE, type Lamp } from "./light";
import { movementSpeed, movementVector } from "./movement";
import { drawPerson } from "./player-sprite";
import {
  BROTHER_START,
  FLOOR_TILE_SIZE,
  PLAYER_START,
  ROOM,
  WALL_TILE_SIZE,
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

function polygon(
  points: [number, number, number][],
  color: number[],
  light: number,
) {
  if (light < 0.008) return;
  ctx.fillStyle = `rgb(${color.map((n) => Math.round(n * light)).join(",")})`;
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const p = project(x, y, z);
    if (index) ctx.lineTo(Math.round(p.x + offsetX), Math.round(p.y + offsetY));
    else ctx.moveTo(Math.round(p.x + offsetX), Math.round(p.y + offsetY));
  });
  ctx.closePath();
  ctx.fill();
}

function drawFloor() {
  const activeLamp = lamp();
  const columns = ROOM.w / FLOOR_TILE_SIZE;
  const rows = ROOM.h / FLOOR_TILE_SIZE;
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const x = ROOM.x + column * FLOOR_TILE_SIZE;
      const y = ROOM.y + row * FLOOR_TILE_SIZE;
      const center = {
        x: x + FLOOR_TILE_SIZE / 2,
        y: y + FLOOR_TILE_SIZE / 2,
      };
      const light = beam(activeLamp, center, 0);
      polygon(
        [
          [x, y, 0],
          [x + FLOOR_TILE_SIZE, y, 0],
          [x + FLOOR_TILE_SIZE, y + FLOOR_TILE_SIZE, 0],
          [x, y + FLOOR_TILE_SIZE, 0],
        ],
        [102, 98, 78],
        light * (0.94 + ((column * 17 + row * 31) % 7) * 0.008),
      );
    }
}

function drawWalls() {
  const activeLamp = lamp();
  const h = 1.3;
  const layers = Math.ceil(h / WALL_TILE_SIZE);
  const drawHorizontalWall = (y: number, color: number[], scale: number) => {
    for (let column = 0; column < ROOM.w / WALL_TILE_SIZE; column++)
      for (let layer = 0; layer < layers; layer++) {
        const x = ROOM.x + column * WALL_TILE_SIZE;
        const z = layer * WALL_TILE_SIZE;
        const sample = { x: x + WALL_TILE_SIZE / 2, y };
        polygon(
          [
            [x, y, z],
            [x + WALL_TILE_SIZE, y, z],
            [x + WALL_TILE_SIZE, y, z + WALL_TILE_SIZE],
            [x, y, z + WALL_TILE_SIZE],
          ],
          color,
          beam(activeLamp, sample, z + WALL_TILE_SIZE / 2) *
            scale *
            (0.96 + ((column * 11 + layer * 7) % 5) * 0.012),
        );
      }
  };
  const drawVerticalWall = (x: number, color: number[], scale: number) => {
    for (let row = 0; row < ROOM.h / WALL_TILE_SIZE; row++)
      for (let layer = 0; layer < layers; layer++) {
        const y = ROOM.y + row * WALL_TILE_SIZE;
        const z = layer * WALL_TILE_SIZE;
        const sample = { x, y: y + WALL_TILE_SIZE / 2 };
        polygon(
          [
            [x, y, z],
            [x, y + WALL_TILE_SIZE, z],
            [x, y + WALL_TILE_SIZE, z + WALL_TILE_SIZE],
            [x, y, z + WALL_TILE_SIZE],
          ],
          color,
          beam(activeLamp, sample, z + WALL_TILE_SIZE / 2) *
            scale *
            (0.96 + ((row * 13 + layer * 5) % 5) * 0.012),
        );
      }
  };
  drawHorizontalWall(0, [128, 122, 94], 0.8);
  drawHorizontalWall(ROOM.h, [112, 108, 86], 0.68);
  for (const x of [0, ROOM.w]) {
    drawVerticalWall(x, [118, 113, 88], 0.72);
  }
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
