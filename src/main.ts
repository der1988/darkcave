import "./style.css";
import { actionFor, held } from "./controls";
import { Possessions, SAVE_KEY, owned } from "./possessions";
import { ITEMS, TARGETS, type Item, type Target } from "./items";
import { Menu, appearance, type MenuAction } from "./menu";
import { drawPlayer } from "./player-sprite";
import { ZONES, zoneAt } from "./zones";
import { beam, surfaceLight, RANGE, type Lamp } from "./light";
import { Creature } from "./creature";
import { Heart, Capture } from "./heart";
import { Sound } from "./audio";
import { Hud } from "./hud";
import {
  canStand,
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
const cargo = new Possessions();
cargo.sync();
let restored: ReturnType<Possessions["load"]> = null;
try {
  restored = cargo.load(localStorage.getItem(SAVE_KEY));
} catch {
  cargo.saveWarning = "Local storage unavailable.";
}
if (restored) Object.assign(player, restored.player);
const camera = { ...player };
const keys = new Set<string>();
function freshCreature(avoidNearby=false){
 const c=new Creature();
 if(!canStand(c.position.x,c.position.y)||(avoidNearby&&Math.hypot(c.position.x-player.x,c.position.y-player.y)<12)){
  const safe=[{x:53.5,y:30.5},{x:80.5,y:52.5},{x:23.5,y:80.5}].find(p=>canStand(p.x,p.y)&&Math.hypot(p.x-player.x,p.y-player.y)>15);
  if(safe)c.position=safe;
 }
 return c;
}
let creature=freshCreature(!!restored);
let heart = new Heart();
let capture = new Capture();
const sound = new Sound();
const hud = new Hud();
let footPhase = 0;
let motionBlend = 0;
let creatureLight = 0;
let audible = 0;
let paused = false;
function unlockAudio() {
  paused = false;
  if (menu?.kind) return;
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
let lightOn = restored?.lightRequested ?? true,
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
let interactionTime = 0,
  feedback = "",
  feedbackTime = 0,
  saveClock = 0;
let pendingSound: "cloth" | "drop" | "mechanism" | undefined;
const save = () => cargo.save(player, lightOn);
const menu = new Menu(
  () => cargo,
  performAction,
  (open) => {
    keys.clear();
    walking = false;
    sound.stopSteps();
    last = performance.now();
    if (open) {
      save();
      sound.suspend();
    } else {
      void sound
        .unlock()
        .then(() => {
          if (pendingSound) {
            sound.object(pendingSound);
            pendingSound = undefined;
          }
        })
        .catch(() => {});
      render();
    }
  },
  () =>
    TARGETS.filter(
      (t) =>
        cargo.reachable(t.position, player, true) &&
        cargo.exposure(t.position, lamp(), true) > 0.035,
    ).map((t) => t.id),
);
function say(text: string) {
  feedback = text;
  feedbackTime = 3;
}
function performAction(a: MenuAction): string {
  let error = "";
  if (a.type === "equip") error = cargo.equip(a.id, a.slot!);
  if (a.type === "unequip") error = cargo.unequip(a.id);
  if (a.type === "drop") error = cargo.drop(a.id, player, [creature.position]);
  if (a.type === "store") error = cargo.store(a.id, a.target!, player);
  if (a.type === "take") error = cargo.take(a.id, player, a.target);
  if (a.type === "use") {
    if (
      a.target !== "drink" &&
      !TARGETS.some(
        (t) =>
          t.id === a.target && cargo.exposure(t.position, lamp(), true) > 0.035,
      )
    )
      return "Illuminate the target first.";
    error = cargo.use(a.id, a.target!, player);
    if (!error && a.target === "drink") heart.settle();
  }
  if (!error) {
    interactionTime = 0.38;
    const cue =
      a.type === "drop" ? "drop" : a.type === "use" ? "mechanism" : "cloth";
    if (menu.kind) pendingSound = cue;
    else sound.object(cue);
    save();
    render();
  }
  return error;
}
function interact() {
  const e = cargo.nearby(player, lamp());
  if (!e) return;
  if ("def" in e) {
    const error = cargo.take(e.id, player);
    say(
      error ||
        `Taken: ${ITEMS[e.def].name}${cargo.canLight ? "" : ". Both hands occupied; use a clip lamp or drop cargo."}`,
    );
    if (!error) {
      interactionTime = 0.38;
      sound.object("cloth");
      save();
    }
    return;
  }
  if (e.rule && !cargo.active.has(e.id)) {
    const item = cargo.items.find(
      (i) =>
        owned(i) &&
        ITEMS[i.def].capability === e.rule!.capability &&
        (!e.rule!.equipped || i.location.kind === "equipped"),
    );
    if (!item) {
      say(e.description);
      return;
    }
    const error = cargo.use(item.id, e.id, player);
    say(error || "The mechanism releases.");
    if (!error) {
      interactionTime = 0.3;
      sound.object("mechanism");
      save();
    }
  }
  if (e.storage && cargo.storageAvailable(e.id, player))
    menu.toggle("inventory", e.id);
  else if (!e.rule) say(e.description);
}
window.addEventListener("keydown", (e) => {
  const action = actionFor(e.code);
  if (!action) return;
  if (
    menu.kind &&
    e.code === "Space" &&
    (e.target as HTMLElement).tagName === "BUTTON"
  )
    return;
  e.preventDefault();
  if (e.repeat) return;
  if (action === "close") {
    if (menu.kind) menu.close();
    return;
  }
  if (capture.elapsed !== null) return;
  if (action === "inventory" || action === "character" || action === "help") {
    menu.toggle(action);
    return;
  }
  if (menu.kind) return;
  keys.add(e.code);
  if (action === "light") {
    lightOn = !lightOn;
    if (lightOn && !cargo.canLight)
      say("Both hands occupied. Equip a clip lamp or drop cargo.");
    save();
  }
  if (action === "interact") interact();
});
window.addEventListener("pagehide", save);
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
const lamp = (): Lamp => ({
  x: lampX,
  y: lampY,
  angle,
  on: lightOn && cargo.canLight,
});
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
  const zone = zoneAt(x, y);
  const color = zone === "yellow" ? palettes[m] : ZONES[zone].floor;
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
        zone === "underground" && y % 7 === 0 && x % 3 === 0 && v < 0.25
          ? [133, 130, 105]
          : color,
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
        const zone = zoneAt(x, y),
          base = ZONES[zone].wall;
        const color =
          z < 0.16
            ? [77, 79, 65]
            : zone === "service" && z > 0.8 && z < 1
              ? [79, 86, 80]
              : base.map((n) => n * (axis === 0 ? 1 : 0.87));
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
    const strength = lamp().on
      ? 0.07 +
        bounce *
          (0.12 + 0.22 * Math.max(0, normal * side)) *
          (0.65 + 0.35 * facingLight)
      : 0.035;
    const v = Math.round(tone * strength);
    return `rgb(${v},${Math.round(v * 0.96)},${Math.round(v * 0.81)})`;
  };
  drawPlayer(
    ctx,
    x,
    y,
    {
      stride,
      walking,
      motion: motionBlend,
      time,
      side,
      back,
      profile,
      load: cargo.weight / cargo.capacity,
      action: interactionTime,
      light: lamp().on,
    },
    appearance(cargo),
    shade,
  );
}
function drawObject(e: Item | Target) {
  const item = "def" in e;
  const position = item
    ? e.location.kind === "world"
      ? e.location.position
      : null
    : e.position;
  if (!position) return;
  const large = item ? !!ITEMS[e.def].large : true;
  const face = cargo.face(position, lamp(), large);
  const intensity = item
    ? cargo.exposure(position, lamp(), large)
    : surfaceLight(lamp(), face.x, face.y, 0.5);
  if (intensity < 0.008 && !large) return;
  if (item && !large) {
    const p = project(position.x, position.y, 0.08);
    const px = Math.round(p.x + offsetX),
      py = Math.round(p.y + offsetY);
    ctx.fillStyle = "#010201";
    ctx.fillRect(px - 3, py + 1, 7, 2);
    ITEMS[e.def].icon.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (v === " ") return;
        const tone = Math.round((v === "+" ? 85 : 155) * intensity);
        ctx.fillStyle = `rgb(${tone},${Math.round(tone * 0.96)},${Math.round(tone * 0.8)})`;
        ctx.fillRect(px + x - 4, py + y - 4, 1, 1);
      }),
    );
    return;
  }
  if (!item && e.kind === "door" && cargo.active.has(e.id)) return;
  const cells =
    !item && e.kind === "door"
      ? (e.cells || [position]).map((p) => ({
          x: Math.floor(p.x) + 0.5,
          y: Math.floor(p.y) + 0.5,
        }))
      : [position];
  for (const p of cells) {
    const radius = !item && e.kind === "door" ? 0.49 : large ? 0.3 : 0.09;
    const h = !item
      ? e.kind === "door"
        ? 1.25
        : e.kind === "machine"
          ? 0.72
          : 0.95
      : large
        ? 0.34
        : 0.06;
    const a = p.x - radius,
      b = p.y - radius,
      c = p.x + radius,
      d = p.y + radius;
    const tone = item ? [141, 130, 101] : [118, 129, 119];
    polygon(
      [
        [a, b, 0],
        [c, b, 0],
        [c, d, 0],
        [a, d, 0],
      ],
      [0, 0, 0],
      0,
    );
    polygon(
      [
        [c, b, 0],
        [c, d, 0],
        [c, d, h],
        [c, b, h],
      ],
      tone,
      intensity * 0.75,
    );
    polygon(
      [
        [a, d, 0],
        [c, d, 0],
        [c, d, h],
        [a, d, h],
      ],
      tone,
      intensity * 0.9,
    );
    polygon(
      [
        [a, b, h],
        [c, b, h],
        [c, d, h],
        [a, d, h],
      ],
      tone,
      intensity,
    );
    if (!item) {
      const q = project(p.x, p.y, h);
      ctx.fillStyle = `rgb(${Math.round(50 * intensity)},${Math.round(65 * intensity)},${Math.round(46 * intensity)})`;
      ctx.fillRect(
        Math.round(q.x + offsetX) - 2,
        Math.round(q.y + offsetY) + 3,
        4,
        cargo.active.has(e.id) ? 1 : 3,
      );
    }
  }
}

function drawCreature() {
  if (beam(lamp(), creature.position.x, creature.position.y, 0.7) < 0.018)
    return;
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
  creature = freshCreature();
  heart = new Heart();
  capture = new Capture();
  lightOn = true;
  angle = targetAngle = bodyAngle = -Math.PI / 2;
  walking = false;
  stride = footPhase = motionBlend = 0;
  mouse = null;
  keys.clear();
  sound.reset();
  hud.reset();
  save();
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
  interactionTime = Math.max(0, interactionTime - dt);
  feedbackTime = Math.max(0, feedbackTime - dt);
  saveClock += dt;
  if (saveClock > 3 && capture.elapsed === null) {
    save();
    saveClock = 0;
  }
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
  const sx = Number(held(keys, "right")) - Number(held(keys, "left"));
  const sy = Number(held(keys, "down")) - Number(held(keys, "up"));
  const direction = screenToWorld(sx, sy);
  const length = Math.hypot(direction.x, direction.y);
  const beforeX = player.x,
    beforeY = player.y;
  if (length > 0) {
    const desired =
      (Math.round(Math.atan2(direction.y, direction.x) / (Math.PI / 4)) *
        Math.PI) /
      4;
    bodyAngle +=
      Math.atan2(Math.sin(desired - bodyAngle), Math.cos(desired - bodyAngle)) *
      (1 - Math.exp(-dt * 12));
    const speed =
      (held(keys, "fast") && cargo.canRush ? 2.6 : 1.65) *
      cargo.speed *
      (interactionTime > 0 ? 0.25 : 1);
    move(
      player,
      (direction.x / length) * speed * dt,
      (direction.y / length) * speed * dt,
    );
    if (!mouse) targetAngle = Math.atan2(direction.y, direction.x);
  }
  walking = Math.hypot(player.x - beforeX, player.y - beforeY) > 0.0001;
  motionBlend+=(Number(walking)-motionBlend)*(1-Math.exp(-dt*12));
  stride += Math.hypot(player.x - beforeX, player.y - beforeY) * 5;
  const phase = Math.floor(stride / Math.PI);
  if (walking && phase !== footPhase) {
    sound.step(player);
    if (cargo.cargo && phase % 3 === 0) sound.object("cloth");
  }
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
  if (!walking) {const target=Math.round(angle/(Math.PI/4))*Math.PI/4;bodyAngle+=Math.atan2(Math.sin(target-bodyAngle),Math.cos(target-bodyAngle))*(1-Math.exp(-dt*10));}
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
    object?: Item | Target;
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
  for (const e of [
    ...cargo.items.filter((i) => i.location.kind === "world"),
    ...TARGETS,
  ]) {
    const p =
      "def" in e
        ? (e.location as { position: { x: number; y: number } }).position
        : e.position;
    if (Math.hypot(p.x - player.x, p.y - player.y) < RANGE + 2)
      drawables.push({ x: p.x, y: p.y, depth: p.x + p.y, object: e });
  }
  drawables.sort((a, b) => a.depth - b.depth);
  for (const d of drawables) {
    if (d.player) character();
    else if (d.creature) drawCreature();
    else if (d.object) drawObject(d.object);
    else wall(d.x, d.y);
  }
  hud.draw(ctx, heart, height);
  const nearby = cargo.nearby(player, lamp());
  const hint =
    feedbackTime > 0
      ? feedback
      : nearby
        ? `E · ${"def" in nearby ? ITEMS[nearby.def].name : nearby.name}`
        : "";
  if (hint && !menu.kind) {
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8e917b";
    ctx.fillText(hint, width / 2, height - 8, Math.max(20, width - 20));
    ctx.textAlign = "left";
  }
  if (capture.elapsed !== null) {
    ctx.fillStyle = `rgba(0,0,0,${capture.opacity})`;
    ctx.fillRect(0, 0, width, height);
  }
}
let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!paused && !menu.kind) {
    time += dt;
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
        menu: menu.kind,
        inventory: cargo.encode(player, lightOn),
        weight: cargo.weight,
        speed: cargo.speed,
        canLight: cargo.canLight,
        zone: zoneAt(player.x, player.y),
      }),
      cargo,
      save,
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
