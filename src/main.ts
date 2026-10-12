import "./style.css";
import { beam, surfaceLight, RANGE, type Lamp } from "./light";
import { Creature } from "./creature";
import { Heart, Capture } from "./heart";
import { Sound } from "./audio";
import { Hud } from "./hud";
import {
  material,
  solid,
  spawn,
  visible,
  move,
  project,
  screenToWorld,
} from "./world";

const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const ctx = canvas.getContext("2d", { alpha: false })!;
const player = { ...spawn };
const camera = { ...spawn };
const keys = new Set<string>();
let creature = new Creature();
let heart = new Heart();
let capture = new Capture();
const sound = new Sound();
const hud = new Hud();
let footPhase = 0;
let creatureLight = 0;
let audible = 0;
let paused = false;
function unlockAudio() {
  paused = false;
  void sound.unlock().catch(() => {
    /* A later gesture can retry audio. */
  });
}
window.addEventListener("keydown", unlockAudio);
window.addEventListener("pointerdown", unlockAudio);
let width = 0,
  height = 0,
  angle = -Math.PI / 2,
  targetAngle = angle;
let bodyAngle = angle;
let lightOn = true,
  walking = false,
  stride = 0,
  time = 0;
let mouse: { x: number; y: number } | null = null;
let offsetX = 0,
  offsetY = 0;
function resize() {
  // Integer CSS-to-logical scaling preserves the silhouette's tiny, crisp pixels.
  const scale = Math.max(1, Math.ceil(window.innerHeight / 360));
  width = canvas.width = Math.ceil(window.innerWidth / scale);
  height = canvas.height = Math.ceil(window.innerHeight / scale);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
resize();
const controls = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Space",
];
window.addEventListener("keydown", (e) => {
  if (!controls.includes(e.code)) return;
  e.preventDefault();
  keys.add(e.code);
  if (e.code === "Space" && !e.repeat && capture.elapsed === null)
    lightOn = !lightOn;
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  paused = true;
  sound.suspend();
});
document.addEventListener("visibilitychange", () => {
  keys.clear();
  paused = document.hidden;
  if (paused) sound.suspend();
  last = performance.now();
});
canvas.addEventListener("pointermove", (e) => {
  mouse = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointerdown", () => canvas.focus());

const palettes = [
  [0, 0, 0],
  [109, 100, 72],
  [93, 98, 84],
  [119, 108, 87],
];
let lampX = player.x,
  lampY = player.y;
const lamp = (): Lamp => ({ x: lampX, y: lampY, angle, on: lightOn });
function illumination(x: number, y: number, z: number, nx = 0, ny = 0) {
  return surfaceLight(lamp(), x, y, z, nx, ny);
}
function polygon(points: number[][], color: number[], intensity: number) {
  ctx.fillStyle = `rgb(${Math.round(color[0] * intensity)},${Math.round(color[1] * intensity)},${Math.round(color[2] * intensity)})`;
  // Scan-convert on the logical pixel grid: adjacent patches share exact edges,
  // avoiding Canvas antialias seams that would look like a decorative tile grid.
  const vertices = points.map(([x, y, z]) => {
    const p = project(x, y, z);
    return { x: Math.round(p.x + offsetX), y: Math.round(p.y + offsetY) };
  });
  const top = Math.max(0, Math.min(...vertices.map((p) => p.y)));
  const bottom = Math.min(height, Math.max(...vertices.map((p) => p.y)));
  for (let row = top; row < bottom; row++) {
    const scan = row + 0.5,
      intersections: number[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i],
        b = vertices[(i + 1) % vertices.length];
      if ((a.y <= scan && b.y > scan) || (b.y <= scan && a.y > scan))
        intersections.push(a.x + ((scan - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    if (intersections.length < 2) continue;
    const left = Math.ceil(Math.min(...intersections) - 0.5);
    const right = Math.ceil(Math.max(...intersections) - 0.5);
    ctx.fillRect(left, row, right - left, 1);
  }
}
function noise(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function floor(x: number, y: number, m: number) {
  const color = palettes[m];
  // Small surface samples receive real light; no cone or visibility-mask overlay.
  const step = 0.25;
  for (let v = 0; v < 1; v += step)
    for (let u = 0; u < 1; u += step) {
      const a = x + u,
        b = y + v;
      const intensity = illumination(a + step / 2, b + step / 2, 0);
      if (intensity < 0.008) continue;
      const variation = 0.96 + noise(a, b) * 0.08;
      polygon(
        [
          [a, b, 0],
          [a + step, b, 0],
          [a + step, b + step, 0],
          [a, b + step, 0],
        ],
        color,
        intensity * variation,
      );
    }
}
const WALL_HEIGHT = 1.28;
function wall(x: number, y: number) {
  // The two camera-facing faces. Hidden faces never become visible through a block.
  for (const axis of [0, 1]) {
    const nx = axis === 0 ? 1 : 0,
      ny = axis === 1 ? 1 : 0;
    if (solid(x + nx, y + ny)) continue;
    for (let u = 0; u < 1; u += 0.25)
      for (let z = 0; z < WALL_HEIGHT; z += 0.16) {
        const a = axis === 0 ? x + 1 : x + u;
        const b = axis === 0 ? y + u : y + 1;
        const ex = axis === 0 ? a : a + 0.25,
          ey = axis === 0 ? b + 0.25 : b;
        const intensity = illumination(
          (a + ex) / 2,
          (b + ey) / 2,
          z + 0.08,
          nx,
          ny,
        );
        const color =
          z < 0.16
            ? [97, 91, 72]
            : axis === 0
              ? [178, 166, 126]
              : [157, 151, 119];
        polygon(
          [
            [a, b, z],
            [ex, ey, z],
            [ex, ey, z + 0.16],
            [a, b, z + 0.16],
          ],
          color,
          intensity,
        );
      }
  }
  polygon(
    [
      [x, y, WALL_HEIGHT],
      [x + 1, y, WALL_HEIGHT],
      [x + 1, y + 1, WALL_HEIGHT],
      [x, y + 1, WALL_HEIGHT],
    ],
    [0, 0, 0],
    0,
  );
  // A narrow lit cap describes thickness; do not illuminate the interior of solid cells.
  for (let u = 0; u < 1; u += 0.25) {
    if (!solid(x + 1, y))
      polygon(
        [
          [x + 0.87, y + u, WALL_HEIGHT],
          [x + 1, y + u, WALL_HEIGHT],
          [x + 1, y + u + 0.25, WALL_HEIGHT],
          [x + 0.87, y + u + 0.25, WALL_HEIGHT],
        ],
        [159, 150, 120],
        illumination(x + 1, y + u + 0.125, WALL_HEIGHT, 1, 0) * 0.7,
      );
    if (!solid(x, y + 1))
      polygon(
        [
          [x + u, y + 0.87, WALL_HEIGHT],
          [x + u + 0.25, y + 0.87, WALL_HEIGHT],
          [x + u + 0.25, y + 1, WALL_HEIGHT],
          [x + u, y + 1, WALL_HEIGHT],
        ],
        [159, 150, 120],
        illumination(x + u + 0.125, y + 1, WALL_HEIGHT, 0, 1) * 0.7,
      );
  }
}
function character() {
  const p = project(player.x, player.y),
    x = Math.round(p.x + offsetX),
    y = Math.round(p.y + offsetY);
  const step = walking ? Math.sin(stride) : 0,
    bob = walking ? Math.round(Math.abs(step)) : 0;
  const aim = project(Math.cos(angle), Math.sin(angle)),
    side = aim.x >= 0 ? 1 : -1;
  const facing = project(Math.cos(bodyAngle), Math.sin(bodyAngle));
  const back = facing.y < 0,
    profile = Math.abs(facing.x) > Math.abs(facing.y) * 2.5;
  // Reflected floor light integrates the body into its surroundings. Facing sides
  // receive more bounce; the far shoulder and back stay dark, including when lit.
  let bounce = 0;
  for (const d of [0.6, 1.2, 2])
    bounce +=
      beam(
        lamp(),
        player.x + Math.cos(angle) * d,
        player.y + Math.sin(angle) * d,
        0,
      ) / 3;
  const facingLight = 0.5 + 0.5 * Math.cos(bodyAngle - angle);
  const shade = (tone: number, normal = 0) => {
    const strength = lightOn
      ? 0.07 +
        bounce *
          (0.12 + 0.22 * Math.max(0, normal * side)) *
          (0.65 + 0.35 * facingLight)
      : 0.025;
    const v = Math.round(tone * strength);
    return `rgb(${v},${Math.round(v * 0.96)},${Math.round(v * 0.81)})`;
  };
  const rect = (
    dx: number,
    dy: number,
    w: number,
    h: number,
    tone: number,
    normal = 0,
  ) => {
    ctx.fillStyle = shade(tone, normal);
    ctx.fillRect(x + dx, y + dy - bob, w, h);
  };
  // Nineteen pixels: head, neck, sloping shoulders, waist, articulated thin limbs.
  const swing = Math.round(step * (profile ? 2 : 1));
  rect(-2 + swing, -7, 1, 6 + Math.round(step), 155, -1);
  rect(1 - swing, -7, 1, 6 - Math.round(step), 165, 1);
  rect(-2 + swing, -2 + Math.round(step), 2, 1, 125, -1);
  rect(1 - swing, -2 - Math.round(step), 2, 1, 125, 1);
  rect(-2, -13, 5, 5, back ? 140 : 160);
  rect(-1, -8, 3, 2, 140);
  rect(-3, -14, 6, 2, 165);
  rect(-1, -16, 2, 2, 180);
  rect(-2, -19, 4, 3, 195);
  rect(-2, -19, 4, 1, 100);
  if (back) rect(-2, -18, 4, 2, 110);
  rect(-3, -13, 1, 4, 145, -1);
  rect(3, -13, 1, 4, 150, 1);
  rect(side > 0 ? -4 : 3, -10 + Math.round(step), 1, 3, 175, -side);
  rect(side > 0 ? 3 : -4, -10, 2, 2, 175, side);
  rect(side > 0 ? 4 : -5, -10, 2, 1, 195, side);
  ctx.fillStyle = lightOn ? "#8f8765" : "#050505";
  ctx.fillRect(x + (side > 0 ? 5 : -6), y - 10 - bob, 2, 1);
}
function drawCreature() {
  if (creatureLight < 0.018) return;
  const p = project(creature.position.x, creature.position.y);
  const x = Math.round(p.x + offsetX),
    y = Math.round(p.y + offsetY);
  const sway = Math.round(Math.sin(time * 1.7 + creature.stride) * 1.2);
  const gait = Math.sin(creature.stride),
    react = creature.state === "reacting" ? 2 : 0;
  const facing = project(
    Math.cos(creature.heading),
    Math.sin(creature.heading),
  );
  const turn = facing.x >= 0 ? 1 : -1,
    profile = Math.abs(facing.x) > Math.abs(facing.y) * 2;
  const rect = (dx: number, dy: number, w: number, h: number, tone: number) => {
    const light = beam(
      lamp(),
      creature.position.x,
      creature.position.y,
      Math.max(0, -dy / 24),
    );
    const v = Math.round(tone * light);
    ctx.fillStyle = `rgb(${v},${Math.round(v * 0.98)},${Math.round(v * 0.88)})`;
    ctx.fillRect(x + dx, y + dy, w, h);
  };
  // An ambiguous thirty-eight-pixel body: narrow torso, unequal hanging arms.
  const leg = Math.round(gait * 2);
  rect(-3 + leg, -17, 2, 16, 53);
  rect(2 - leg, -16, 1, 16, 66);
  rect(-2 + sway, -30, profile ? 3 : 5, 14, 47);
  rect(-4 + sway, -31, 8, 3, 62);
  rect(-6 + sway - react, -28, 1, 17, 62);
  rect(-5 + sway - react, -13, 1, 5, 48);
  rect(5 + sway + react, -29, 1, 20, 58);
  rect(4 + sway + react, -10, 2, 4, 42);
  rect(sway, -35, 1, 5, 65);
  rect(-1 + sway + turn, -38, profile ? 2 : 3, 4, facing.y < 0 ? 55 : 70);
}
function restart() {
  Object.assign(player, spawn);
  Object.assign(camera, spawn);
  creature = new Creature();
  heart = new Heart();
  capture = new Capture();
  lightOn = true;
  angle = targetAngle = bodyAngle = -Math.PI / 2;
  walking = false;
  stride = footPhase = 0;
  mouse = null;
  keys.clear();
  sound.reset();
  hud.reset();
}
function updateSurvival(dt: number) {
  creatureLight = beam(lamp(), creature.position.x, creature.position.y, 0.7);
  const seen = creatureLight > 0.055;
  const vocal = creature.update(dt, seen ? player : null);
  if (vocal) sound.vocalize();
  audible = sound.spatial(player, creature.position);
  heart.perceive(
    creatureLight > 0.018,
    seen && creature.state === "pursuing",
    audible,
  );
  if (heart.update(dt)) sound.heartbeat(heart.bpm);
  hud.update(dt, heart);
  if (creature.canCapture(player)) {
    capture.start();
    sound.stopSteps();
    heart.bpm = 160;
    heart.phase = 0;
    heart.beatAge = 0;
    heart.beats++;
    sound.heartbeat(heart.bpm);
  }
  // Re-evaluate after movement so rendering never uses yesterday's visibility.
  creatureLight = beam(lamp(), creature.position.x, creature.position.y, 0.7);
}
function update(dt: number) {
  if (capture.elapsed !== null) {
    if (capture.update(dt)) {
      restart();
      return;
    }
    if (capture.silent) {
      if (!sound.muted) sound.silence();
    } else if (heart.update(dt, true)) sound.heartbeat(heart.bpm);
    hud.update(dt, heart);
    return;
  }
  const sx =
    Number(keys.has("KeyD") || keys.has("ArrowRight")) -
    Number(keys.has("KeyA") || keys.has("ArrowLeft"));
  const sy =
    Number(keys.has("KeyS") || keys.has("ArrowDown")) -
    Number(keys.has("KeyW") || keys.has("ArrowUp"));
  const direction = screenToWorld(sx, sy);
  const length = Math.hypot(direction.x, direction.y);
  const beforeX = player.x,
    beforeY = player.y;
  if (length > 0) {
    bodyAngle =
      (Math.round(Math.atan2(direction.y, direction.x) / (Math.PI / 4)) *
        Math.PI) /
      4;
    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 2.6 : 1.65;
    move(
      player,
      (direction.x / length) * speed * dt,
      (direction.y / length) * speed * dt,
    );
    if (!mouse) targetAngle = Math.atan2(direction.y, direction.x);
  }
  walking = Math.hypot(player.x - beforeX, player.y - beforeY) > 0.0001;
  stride += Math.hypot(player.x - beforeX, player.y - beforeY) * 5;
  const phase = Math.floor(stride / Math.PI);
  if (walking && phase !== footPhase) sound.step(player);
  if (!walking) sound.stopSteps();
  footPhase = phase;
  const follow = 1 - Math.exp(-dt * 5);
  camera.x += (player.x - camera.x) * follow;
  camera.y += (player.y - camera.y) * follow;
  const c = project(camera.x, camera.y);
  offsetX = width / 2 - c.x;
  offsetY = height / 2 - c.y + 9;
  if (mouse) {
    const p = project(player.x, player.y, 0.4);
    const aim = screenToWorld(
      (mouse.x / innerWidth) * width - p.x - offsetX,
      (mouse.y / innerHeight) * height - p.y - offsetY,
    );
    if (Math.hypot(aim.x, aim.y) > 0.1) targetAngle = Math.atan2(aim.y, aim.x);
  }
  angle +=
    Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle)) *
    (1 - Math.exp(-dt * 16));
  if (!walking) bodyAngle = (Math.round(angle / (Math.PI / 4)) * Math.PI) / 4;
  // Hand offset in the same projected location as the tiny flashlight sprite.
  const side = project(Math.cos(angle), Math.sin(angle)).x >= 0 ? 1 : -1;
  const hand = screenToWorld(side * 5, 0);
  lampX = player.x + hand.x;
  lampY = player.y + hand.y;
  if (solid(lampX, lampY)) {
    lampX = player.x;
    lampY = player.y;
  }
  updateSurvival(dt);
}
function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  const drawables: {
    x: number;
    y: number;
    depth: number;
    player?: boolean;
    creature?: boolean;
  }[] = [];
  for (
    let y = Math.floor(player.y - RANGE - 1);
    y <= player.y + RANGE + 1;
    y++
  ) {
    for (
      let x = Math.floor(player.x - RANGE - 1);
      x <= player.x + RANGE + 1;
      x++
    ) {
      if (Math.hypot(x + 0.5 - player.x, y + 0.5 - player.y) > RANGE + 1.5)
        continue;
      const m = material(x, y);
      if (m) floor(x, y, m);
      else if (!solid(x + 1, y) || !solid(x, y + 1))
        drawables.push({ x, y, depth: x + y + 1 });
    }
  }
  drawables.push({
    x: player.x,
    y: player.y,
    depth: player.x + player.y,
    player: true,
  });
  drawables.push({
    x: creature.position.x,
    y: creature.position.y,
    depth: creature.position.x + creature.position.y,
    creature: true,
  });
  drawables.sort((a, b) => a.depth - b.depth);
  for (const d of drawables) {
    if (d.player) character();
    else if (d.creature) drawCreature();
    else wall(d.x, d.y);
  }
  hud.draw(ctx, heart, height);
  if (capture.elapsed !== null) {
    ctx.fillStyle = `rgba(0,0,0,${capture.opacity})`;
    ctx.fillRect(0, 0, width, height);
  }
}
let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  time += dt;
  if (!paused) {
    update(dt);
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Development-only acceptance harness. Vite removes this branch from production.
if (import.meta.env.DEV)
  Object.assign(window, {
    __liminal: {
      snapshot: () => ({
        player: { ...player },
        creature: { ...creature.position },
        state: creature.state,
        lastKnown: creature.lastKnown ? { ...creature.lastKnown } : null,
        lightOn,
        creatureLight,
        bpm: heart.bpm,
        beats: heart.beats,
        audioBeats: sound.heartbeatCount,
        steps: sound.footstepCount,
        audio: sound.context?.state,
        capture: capture.elapsed,
        audible,
      }),
      place: (
        p: { x: number; y: number },
        c: { x: number; y: number },
        a: number,
        on = true,
      ) => {
        restart();
        Object.assign(player, p);
        Object.assign(camera, p);
        Object.assign(creature.position, c);
        angle = targetAngle = a;
        lightOn = on;
      },
    },
  });
