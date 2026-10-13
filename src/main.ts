import "./style.css";
import { HOME, MEMORY_ROOMS, inHome, inDarkNetwork } from "./levels";
import { Companion } from "./companion";
import { Dialogue } from "./dialogue";
import { pixelText, speechLines } from "./pixel-text";
import { motionInput, type Gait } from "./movement";
import { SoundEvents } from "./sound-events";
import { createInhabitants, type Inhabitant } from "./enemies";
import { perceived, inView } from "./vision";
import { footprintRegion } from "./base";
import { pursuerForbidden, homeEquipmentLight } from "./environments";
import { actionFor, held } from "./controls";
import { Possessions, SAVE_KEY, owned } from "./possessions";
import { ITEMS, TARGETS, type Item, type Target } from "./items";
import { Menu, appearance, type MenuAction } from "./menu";
import { drawPlayer, drawChild } from "./player-sprite";
import { FURNITURE, isSafe, roomLight, type Furniture } from "./environments";
import { drawFurniture } from "./scenery";
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
const player = { ...HOME.spawn };
const cargo = new Possessions();
cargo.sync();
let restored: ReturnType<Possessions["load"]> = null;
try {
  restored = cargo.load(localStorage.getItem(SAVE_KEY));
} catch {
  cargo.saveWarning = "Local storage unavailable.";
}
if (restored) Object.assign(player, restored.player);
if (!restored) cargo.exploration.revealHome();
const companion = new Companion(cargo.chapter.companion);
let inhabitants = createInhabitants();
const noises = new SoundEvents();
const dialogue = new Dialogue();
let gait: Gait = "walk",
  grace = 2,
  inhabitantAudible = 0,
  confirmedPursuer = false,
  generatorClock = 0;
const camera = { ...player };
const keys = new Set<string>();
function freshCreature(avoidNearby = false) {
  const c = new Creature(Math.random, pursuerForbidden);
  if (
    pursuerForbidden(c.position.x, c.position.y) ||
    !canStand(c.position.x, c.position.y) ||
    (avoidNearby &&
      Math.hypot(c.position.x - player.x, c.position.y - player.y) < 12)
  ) {
    const safe = [
      { x: 41.5, y: 30.5 },
      { x: 71.5, y: 63.5 },
      { x: 32.5, y: 75.5 },
    ].find(
      (p) =>
        !pursuerForbidden(p.x, p.y) &&
        canStand(p.x, p.y) &&
        Math.hypot(p.x - player.x, p.y - player.y) > 15,
    );
    if (safe) c.position = safe;
  }
  return c;
}
let creature = freshCreature(!!restored);
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
  angle = cargo.chapter.facing,
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
const save = () => {
  cargo.chapter.facing = angle;
  cargo.chapter.companion = { ...companion.position };
  cargo.save(player, lightOn);
};
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
        cargo.exposure(t.position, lamp(), true) > 0.035 &&
        inView(player, angle, t.position) &&
        perceived(player, angle, lamp(), cargo.face(t.position, player, true)),
    ).map((t) => t.id),
  () => player,
  () => angle,
);
function say(text: string) {
  feedback = text;
  feedbackTime = 3;
}
function performAction(a: MenuAction): string {
  let error = "";
  if (a.type === "place")
    error = inHome(player)
      ? cargo.placeFurniture(a.id, a.position!, a.rotation || 0, [
          player,
          companion.position,
        ])
      : "Torna a casa per sistemare i mobili.";
  if (a.type === "generator") {
    const i = cargo.item(a.id);
    if (
      i?.def === "generator" &&
      i.location.kind === "world" &&
      inHome(i.location.position) &&
      cargo.reachable(i.location.position, player, true)
    )
      cargo.chapter.generatorOn = !cargo.chapter.generatorOn;
    else error = "Avvicinati al generatore sistemato in casa.";
  }
  if (a.type === "restore") {
    try {
      const raw = localStorage.getItem(SAVE_KEY + ".backup");
      if (!raw) return "Nessuna copia precedente disponibile.";
      const candidate = new Possessions(),
        restored = candidate.load(raw);
      cargo.sync();
      if (!restored)
        return "La copia non è compatibile. La partita attuale resta intatta.";
      localStorage.setItem(
        SAVE_KEY + ".before-restore",
        JSON.stringify(cargo.encode(player, lightOn)),
      );
      const result = cargo.load(raw);
      if (!result) return "Ripristino non riuscito.";
      Object.assign(player, result.player);
      Object.assign(camera, result.player);
      companion.reset(cargo.chapter.companion);
      angle = targetAngle = bodyAngle = cargo.chapter.facing;
      lightOn = result.lightRequested;
      creature = freshCreature(true);
      inhabitants = createInhabitants();
      grace = 2;
      heart = new Heart();
      capture = new Capture();
      sound.reset();
      hud.reset();
      dialogue.clear();
      noises.events = [];
      confirmedPursuer = false;
      mouse = null;
      save();
      menu.close();
      return "";
    } catch {
      return "Ripristino non disponibile. Nessun progresso è stato cancellato.";
    }
  }
  if (a.type === "reset") {
    try {
      localStorage.setItem(
        SAVE_KEY + ".backup",
        JSON.stringify(cargo.encode(player, lightOn)),
      );
    } catch {
      return "Impossibile conservare la partita attuale. Nessun progresso è stato cancellato.";
    }
    const fresh = new Possessions();
    fresh.exploration.revealHome();
    if (!cargo.load(JSON.stringify(fresh.encode(HOME.spawn, true))))
      return "Ripristino non riuscito.";
    restart();
    menu.close();
    return "";
  }
  if (a.type === "equip") error = cargo.equip(a.id, a.slot!);
  if (a.type === "unequip") error = cargo.unequip(a.id);
  if (a.type === "drop")
    error = cargo.drop(a.id, player, [
      creature.position,
      companion.position,
      ...inhabitants.map((e) => e.ai.position),
    ]);
  if (a.type === "store") error = cargo.store(a.id, a.target!, player);
  if (a.type === "take") error = cargo.take(a.id, player, a.target);
  if (a.type === "use") {
    if (
      a.target !== "drink" &&
      !TARGETS.some(
        (t) =>
          t.id === a.target &&
          cargo.exposure(t.position, lamp(), true) > 0.035 &&
          inView(player, angle, t.position) &&
          perceived(
            player,
            angle,
            lamp(),
            cargo.face(t.position, player, true),
          ),
      )
    )
      return "Illuminate the target first.";
    error = cargo.use(a.id, a.target!, player);
    if (!error && a.target === "drink") heart.settle();
  }
  if (!error) {
    interactionTime = 0.38;
    if (a.type === "drop" || a.type === "use" || a.type === "place")
      noises.emit(
        "older",
        player,
        a.type === "drop"
          ? "drop"
          : a.type === "place"
            ? "furniture"
            : "mechanism",
        1,
        a.type === "drop" ? 12 : 7,
        time,
      );
    const cue =
      a.type === "drop" || a.type === "place"
        ? "drop"
        : a.type === "use" || a.type === "generator"
          ? "mechanism"
          : "cloth";
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
    if (
      ITEMS[e.def].furniture &&
      e.location.kind === "world" &&
      inHome(e.location.position)
    ) {
      menu.toggle("inventory", e.id);
      return;
    }
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
  if (e.kind === "computer") {
    menu.toggle("computer");
    return;
  }
  if (e.kind === "archive") {
    const memory = cargo.items.find(
      (i) => owned(i) && ITEMS[i.def].capability === "memory",
    );
    if (memory) {
      const error = cargo.use(memory.id, e.id, player);
      say(error || "Il ricordo resta qui.");
      if (!error) {
        sound.object("cloth");
        save();
      }
    } else
      say(
        `Ricordi riportati: ${cargo.delivered.length}/2.${cargo.complete ? " Il computer ha una nuova destinazione." : ""}`,
      );
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
      noises.emit("older", player, "mechanism", 0.8, 9, time);
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
  const sample = { x: x + nx * 0.012, y: y + ny * 0.012 };
  const live =
    inView(player, angle, sample) &&
    visible(player.x, player.y, sample.x, sample.y);
  const remembered = cargo.exploration.cells.has(
    Math.floor(y) * 112 + Math.floor(x),
  );
  return (
    surfaceLight(lamp(), x, y, z, nx, ny) * (live ? 1 : remembered ? 0.18 : 0)
  );
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
          : zone === "mall" && (x % 6 === 0 || y % 6 === 0)
            ? [104, 111, 104]
            : zone === "playground" && x >= 12 && x < 30 && y >= 6 && y < 15
              ? (Math.floor(x / 3) + Math.floor(y / 3)) % 2
                ? [104, 106, 90]
                : [105, 94, 83]
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
        const fixture =
          roomLight(a + nx * 0.012, b + ny * 0.012, z) > 0 &&
          (x + y) % 5 === 0 &&
          z > 0.96 &&
          z < 1.13;
        const color = fixture
          ? [195, 193, 154]
          : z < 0.16
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
          fixture ? Math.min(0.8, intensity * 1.4) : intensity,
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
    const v = Math.round(
      tone * (strength + roomLight(player.x, player.y, 0.6) * 0.85),
    );
    return `rgb(${v},${Math.round(v * 0.96)},${Math.round(v * 0.81)})`;
  };
  drawPlayer(
    ctx,
    x,
    y,
    {
      facing: bodyAngle,
      gait,
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
  if (
    !inView(player, angle, position) ||
    !perceived(player, angle, lamp(), face)
  )
    return;
  if (item && ITEMS[e.def].furniture) {
    const r = footprintRegion(e)!;
    drawFurniture(
      {
        id: e.id,
        kind: ITEMS[e.def].furniture!,
        x: r.x,
        y: r.y,
        w: r.w,
        d: r.h,
        h: e.def === "standlamp" ? 1 : e.def === "shelf" ? 0.8 : 0.65,
      },
      polygon,
      lamp(),
    );
    return;
  }
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

const emptyAppearance = {
  backpack: false,
  bodyLight: false,
  harness: false,
  cargo: false,
  twoHanded: false,
  attached: false,
  tool: false,
};
function personShade(p: { x: number; y: number }) {
  const light = Math.min(
    0.9,
    roomLight(p.x, p.y, 0.5) + beam(lamp(), p.x, p.y, 0.5) * 0.6 + 0.025,
  );
  return (tone: number) =>
    `rgb(${Math.round(tone * light)},${Math.round(tone * light * 0.94)},${Math.round(tone * light * 0.79)})`;
}
function drawCompanion() {
  const p = companion.position;
  if (!perceived(player, angle, lamp(), p)) return;
  const screen = project(p.x, p.y);
  drawChild(
    ctx,
    Math.round(screen.x + offsetX),
    Math.round(screen.y + offsetY),
    companion.heading,
    companion.stride,
    companion.walking,
    time,
    gait,
    personShade(p),
  );
}
function drawMemory(room: (typeof MEMORY_ROOMS)[number]) {
  const p = room.person;
  if (!perceived(player, angle, lamp(), p)) return;
  const q = project(p.x, p.y),
    x = Math.round(q.x + offsetX),
    y = Math.round(q.y + offsetY);
  drawPlayer(
    ctx,
    x,
    y,
    {
      facing: Math.PI / 2,
      stride: 0,
      walking: false,
      motion: 0,
      time: time + (room.id === "kitchen" ? 2 : 5),
      side: 1,
      back: false,
      profile: false,
      load: 0,
      action: 0,
      light: false,
    },
    emptyAppearance,
    personShade(p),
  );
  ctx.fillStyle = personShade(p)(room.id === "kitchen" ? 180 : 110);
  ctx.fillRect(x - 1, y - 12, 3, 5);
}
function drawInhabitant(e: Inhabitant) {
  const p = e.ai.position;
  if (!perceived(player, angle, lamp(), p) || isSafe(p.x, p.y)) return;
  const q = project(p.x, p.y),
    x = Math.round(q.x + offsetX),
    y = Math.round(q.y + offsetY),
    shade = personShade(p);
  const step = Math.round(
    Math.sin(e.ai.stride) * (e.kind === "clicker" ? 1 : 2),
  );
  const rect = (a: number, b: number, w: number, h: number, t: number) => {
    ctx.fillStyle = shade(t);
    ctx.fillRect(x + a, y + b, w, h);
  };
  ctx.fillStyle = "#020302";
  ctx.fillRect(x - 4, y, 8, 1);
  rect(-2 + step, -7, 1, 7, 100);
  rect(2 - step, -8, 1, 8, 110);
  rect(-2, -15, 5, 8, e.kind === "clicker" ? 92 : 125);
  rect(-4, -13, 1, 8, 112);
  rect(4, -12, 1, 9, 108);
  if (e.kind === "clicker") {
    rect(-4, -17, 7, 4, 121);
    rect(-3, -19, 2, 3, 145);
    rect(1, -18, 3, 3, 103);
  } else {
    rect(-1, -20, 3, 5, 153);
    rect(-2, -20, 4, 1, 86);
  }
}
function drawDialogue() {
  const speech = dialogue.current;
  if (!speech || gait === "silent" || menu.kind) return;
  const p =
    speech.position ||
    (speech.speaker === "older" ? player : companion.position);
  if (speech.speaker !== "older" && !perceived(player, angle, lamp(), p))
    return;
  const q = project(p.x, p.y),
    lines = speechLines(
      speech.text,
      Math.min(45, Math.floor((width - 16) / 4)),
    ),
    length = Math.max(...lines.map((l) => l.length)) * 4;
  const x = Math.round(
      Math.max(5, Math.min(width - length - 5, q.x + offsetX - length / 2)),
    ),
    y = Math.round(Math.max(12, q.y + offsetY - 29 - lines.length * 9));
  ctx.fillStyle = "rgba(5,8,6,.88)";
  ctx.fillRect(x - 3, y - 4, length + 6, lines.length * 9 + 3);
  lines.forEach((line, i) => pixelText(ctx, line, x, y + i * 9));
}
function drawCreature() {
  if (
    pursuerForbidden(creature.position.x, creature.position.y) ||
    !perceived(player, angle, lamp(), creature.position)
  )
    return;
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
  Object.assign(player, HOME.spawn);
  Object.assign(camera, HOME.spawn);
  companion.reset(HOME.child);
  cargo.chapter.health = 100;
  cargo.chapter.childHealth = 100;
  inhabitants = createInhabitants();
  noises.events = [];
  dialogue.clear();
  grace = 2;
  confirmedPursuer = false;
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
  grace = Math.max(0, grace - dt);
  noises.prune(time);
  creatureLight = beam(lamp(), creature.position.x, creature.position.y, 0.7);
  const seen =
    creatureLight > 0.055 &&
    perceived(player, angle, lamp(), creature.position);
  const brothers = [player, companion.position];
  // Illumination exposes the source only with actual reciprocal line of sight.
  const observation =
    creatureLight > 0.055
      ? brothers.find(
          (p) =>
            !pursuerForbidden(p.x, p.y) &&
            visible(creature.position.x, creature.position.y, p.x, p.y),
        )
      : undefined;
  const vocal = creature.update(dt, grace === 0 ? observation || null : null);
  if (vocal) sound.vocalize();
  audible = sound.spatial(player, creature.position);
  inhabitantAudible *= Math.exp(-dt * 3);
  let visibleHostile = seen,
    visiblePursuit = seen && creature.state === "pursuing";
  for (const enemy of inhabitants) {
    const struck = enemy.update(
      dt,
      grace === 0 ? brothers : [],
      lamp(),
      noises,
      time,
    );
    if (struck >= 0 && grace === 0) {
      if (struck === 0)
        cargo.chapter.health = Math.max(
          0,
          cargo.chapter.health - (enemy.kind === "clicker" ? 45 : 18),
        );
      else
        cargo.chapter.childHealth = Math.max(
          0,
          cargo.chapter.childHealth - (enemy.kind === "clicker" ? 45 : 18),
        );
      heart.perceive(true, true, 0);
    }
    if (enemy.voiceIn <= 0) {
      enemy.voiceIn = 6 + Math.random() * 10;
      inhabitantAudible = Math.max(
        inhabitantAudible,
        sound.inhabitant(enemy.kind, player, enemy.ai.position),
      );
    }
    const visible = perceived(player, angle, lamp(), enemy.ai.position);
    if (visible) {
      visibleHostile = true;
      visiblePursuit ||= enemy.ai.state === "pursuing";
    }
  }
  if (isSafe(player.x, player.y)) heart.settle();
  else
    heart.perceive(
      visibleHostile,
      visiblePursuit,
      Math.max(audible, inhabitantAudible),
    );
  if (inHome(player))
    cargo.chapter.health = Math.min(100, cargo.chapter.health + dt * 3);
  if (inHome(companion.position))
    cargo.chapter.childHealth = Math.min(
      100,
      cargo.chapter.childHealth + dt * 3,
    );
  if (heart.update(dt)) sound.heartbeat(heart.bpm);
  hud.update(dt, heart);
  const caught = grace === 0 && brothers.some((p) => creature.canCapture(p));
  if (caught || cargo.chapter.health <= 0 || cargo.chapter.childHealth <= 0) {
    capture.start();
    sound.stopSteps();
    heart.bpm = 160;
  }
  if (seen && (creature.state === "pursuing" || creature.state === "reacting"))
    confirmedPursuer = true;
  if (
    creature.state === "wandering" ||
    creature.state === "searching" ||
    isSafe(player.x, player.y)
  )
    confirmedPursuer = false;
  sound.music(dt, confirmedPursuer);
  sound.ambience(dt, zoneAt(player.x, player.y), cargo.generatorPowered);
  const danger =
    visiblePursuit ||
    Math.max(audible, inhabitantAudible) > 0.12 ||
    inhabitants.some(
      (e) =>
        ["pursuing", "remembering"].includes(e.ai.state) &&
        Math.hypot(e.ai.position.x - player.x, e.ai.position.y - player.y) < 8,
    );
  dialogue.update(
    dt,
    player,
    companion.position,
    gait === "silent",
    danger,
    cargo.chapter.events,
    (p) => perceived(player, angle, lamp(), p),
  );
  homeEquipmentLight(cargo.lampPowered);
  generatorClock -= dt;
  if (cargo.generatorPowered && generatorClock <= 0) {
    generatorClock = 3;
    const gen = cargo.items.find(
      (i) => i.def === "generator" && i.location.kind === "world",
    );
    if (gen?.location.kind === "world")
      noises.emit(
        "generator",
        gen.location.position,
        "generator",
        0.3,
        4,
        time,
      );
  }
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
  const motion = motionInput(
    sx,
    sy,
    held(keys, "silent"),
    held(keys, "fast"),
    cargo.speed,
    cargo.canRush,
  );
  gait = motion.gait;
  const direction = { x: motion.x, y: motion.y };
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
    const speed = motion.speed * (interactionTime > 0 ? 0.25 : 1);
    move(
      player,
      (direction.x / length) * speed * dt,
      (direction.y / length) * speed * dt,
    );
    if (!mouse) targetAngle = Math.atan2(direction.y, direction.x);
  }
  walking = Math.hypot(player.x - beforeX, player.y - beforeY) > 0.0001;
  motionBlend += (Number(walking) - motionBlend) * (1 - Math.exp(-dt * 12));
  stride += Math.hypot(player.x - beforeX, player.y - beforeY) * 5;
  const phase = Math.floor(stride / Math.PI);
  if (walking && phase !== footPhase && gait !== "silent") {
    const running = gait === "run";
    sound.step(player, running ? 1.3 : 0.7);
    noises.emit(
      "older",
      player,
      "step",
      running ? 1 : 0.3,
      running ? 11 : 3.5,
      time,
    );
    if (cargo.cargo && phase % 3 === 0) sound.object("cloth");
  }
  if (!walking || gait === "silent") sound.stopSteps(gait === "silent");
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
  if (!walking) {
    const target = (Math.round(angle / (Math.PI / 4)) * Math.PI) / 4;
    bodyAngle +=
      Math.atan2(Math.sin(target - bodyAngle), Math.cos(target - bodyAngle)) *
      (1 - Math.exp(-dt * 10));
  }
  // Hand offset in the same projected location as the tiny flashlight sprite.
  const side = project(Math.cos(angle), Math.sin(angle)).x >= 0 ? 1 : -1;
  const hand = screenToWorld(side * 5, 0);
  lampX = player.x + hand.x;
  lampY = player.y + hand.y;
  if (solid(lampX, lampY)) {
    lampX = player.x;
    lampY = player.y;
  }
  if (mouse)
    bodyAngle +=
      Math.atan2(Math.sin(angle - bodyAngle), Math.cos(angle - bodyAngle)) *
      (1 - Math.exp(-dt * 12));
  const threats = [
    creature.position,
    ...inhabitants.map((e) => e.ai.position),
  ].filter(
    (p) =>
      perceived(player, angle, lamp(), p) ||
      perceived(companion.position, companion.heading, lamp(), p),
  );
  const childStep = companion.update(dt, player, gait, walking, threats);
  if (childStep && gait !== "silent") {
    const running = gait === "run";
    sound.step(companion.position, running ? 0.7 : 0.4, true, player);
    noises.emit(
      "child",
      companion.position,
      "step",
      running ? 0.7 : 0.25,
      running ? 9 : 3,
      time,
    );
  }
  cargo.exploration.visit(player, angle, lamp());
  updateSurvival(dt);
}
function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  // Lit rooms remain visible across the whole viewport, beyond the torch radius.
  const viewRadius = Math.ceil(width / 48 + height / 24 + WALL_HEIGHT + 2);
  const drawables: {
    x: number;
    y: number;
    depth: number;
    player?: boolean;
    creature?: boolean;
    object?: Item | Target;
    furniture?: Furniture;
    child?: boolean;
    inhabitant?: Inhabitant;
    memory?: (typeof MEMORY_ROOMS)[number];
  }[] = [];
  for (
    let y = Math.floor(player.y - viewRadius);
    y <= player.y + viewRadius;
    y++
  ) {
    for (
      let x = Math.floor(player.x - viewRadius);
      x <= player.x + viewRadius;
      x++
    ) {
      const screen = project(x + 0.5, y + 0.5);
      if (
        screen.x + offsetX < -26 ||
        screen.x + offsetX > width + 26 ||
        screen.y + offsetY < -14 ||
        screen.y + offsetY > height + WALL_HEIGHT * 24 + 14
      )
        continue;
      if (
        Math.hypot(x + 0.5 - player.x, y + 0.5 - player.y) > RANGE + 1.5 &&
        !roomLight(x + 0.5, y + 0.5) &&
        !roomLight(x + 1.01, y + 0.5) &&
        !roomLight(x + 0.5, y + 1.01)
      )
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
  for (const f of FURNITURE) {
    if (
      Math.hypot(f.x + f.w / 2 - player.x, f.y + f.d / 2 - player.y) <
      viewRadius + 4
    )
      drawables.push({
        x: f.x,
        y: f.y,
        depth: f.x + f.y + (f.w + f.d) / 2,
        furniture: f,
      });
  }
  drawables.push({
    x: companion.position.x,
    y: companion.position.y,
    depth: companion.position.x + companion.position.y,
    child: true,
  });
  for (const e of inhabitants)
    drawables.push({
      x: e.ai.position.x,
      y: e.ai.position.y,
      depth: e.ai.position.x + e.ai.position.y,
      inhabitant: e,
    });
  for (const r of MEMORY_ROOMS)
    drawables.push({
      x: r.person.x,
      y: r.person.y,
      depth: r.person.x + r.person.y,
      memory: r,
    });
  drawables.sort((a, b) => a.depth - b.depth);
  for (const d of drawables) {
    if (d.player) character();
    else if (d.creature) drawCreature();
    else if (d.object) {
      drawObject(d.object);
      if (
        !("def" in d.object) &&
        (d.object.kind === "computer" || d.object.kind === "archive")
      ) {
        const t = d.object,
          p = project(t.position.x, t.position.y, 0.95),
          face = cargo.face(t.position, player, true);
        if (
          inView(player, angle, t.position) &&
          perceived(player, angle, lamp(), face)
        ) {
          const x = Math.round(p.x + offsetX),
            y = Math.round(p.y + offsetY);
          ctx.fillStyle = "#15251f";
          ctx.fillRect(x - 5, y - 7, 10, 6);
          ctx.fillStyle = "#778774";
          if (t.kind === "computer") {
            ctx.fillRect(x - 3, y - 5, 5, 1);
            ctx.fillRect(x - 3, y - 3, 2, 1);
          } else
            cargo.delivered.forEach((_, i) =>
              ctx.fillRect(x - 3 + i * 5, y - 5, 3, 3),
            );
        }
      }
    } else if (d.child) drawCompanion();
    else if (d.inhabitant) drawInhabitant(d.inhabitant);
    else if (d.memory) drawMemory(d.memory);
    else if (d.furniture) {
      const face = cargo.face(
        { x: d.furniture.x + 0.5, y: d.furniture.y + 0.5 },
        player,
        true,
      );
      if (perceived(player, angle, lamp(), face)) {
        drawFurniture(d.furniture, polygon, lamp());
        if (d.furniture.kind === "hotel-door") {
          const p = project(d.furniture.x + 0.5, d.furniture.y + 0.3, 0.9);
          pixelText(
            ctx,
            String(101 + Math.floor((d.furniture.y - 61) / 10)),
            p.x + offsetX - 6,
            p.y + offsetY,
            "#797463",
          );
        }
      }
    } else wall(d.x, d.y);
  }
  hud.draw(ctx, heart, height, cargo.chapter.health, cargo.chapter.childHealth);
  drawDialogue();
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
        companion: { ...companion.position },
        gait,
        childGait: companion.gait,
        health: cargo.chapter.health,
        childHealth: cargo.chapter.childHealth,
        enemies: inhabitants.map((e) => ({
          id: e.id,
          kind: e.kind,
          position: { ...e.ai.position },
          state: e.ai.state,
          lastKnown: e.ai.lastKnown,
        })),
        dialogue: dialogue.current,
        music: sound.musicLevel,
        noises: noises.events,
        complete: cargo.complete,
        power: cargo.lampPowered,
      }),
      cargo,
      setInhabitant: (id: string, p: { x: number; y: number }) => {
        const enemy = inhabitants.find((e) => e.id === id);
        if (enemy) {
          enemy.ai.position = { ...p };
          enemy.ai.state = "pursuing";
          enemy.ai.lastKnown = { ...player };
          grace = 0;
        }
      },
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
        companion.reset(Companion.validNear(p));
        grace = 0;
        Object.assign(creature.position, c);
        angle = targetAngle = a;
        lightOn = on;
      },
    },
  });
