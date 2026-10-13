import { SIZE, material, solid, visible, geometryRevision } from "./world";
import { perceived, inView } from "./vision";
import type { Point, Lamp } from "./light";
import { roomLight, isSafe } from "./environments";
import { HOME, IMPORTANT_PLACES, type LevelId } from "./levels";
import { zoneAt, ZONES } from "./zones";
type LayerMemory = { floor: number[]; walls: number[]; blocked: number[] };
export type MapView = { zoom: number; center: Point; angle: number };
export class Exploration {
  private floors: Record<LevelId, Set<number>> = {
    surface: new Set(),
    unknown: new Set(),
  };
  private walls: Record<LevelId, Set<number>> = {
    surface: new Set(),
    unknown: new Set(),
  };
  private blocked: Record<LevelId, Set<number>> = {
    surface: new Set(),
    unknown: new Set(),
  };
  level: LevelId = "surface";
  private last = "";
  get cells() {
    return this.floors[this.level];
  }
  revealHome() {
    for (let y = HOME.y; y < HOME.y + HOME.h; y++)
      for (let x = HOME.x; x < HOME.x + HOME.w; x++)
        if (material(x, y)) this.floors.surface.add(y * SIZE + x);
  }
  visit(p: Point, angle = 0, lamp: Lamp = { ...p, angle, on: true }) {
    const key = `${this.level}:${Math.floor(p.x * 3)},${Math.floor(p.y * 3)},${Math.round((angle * 24) / Math.PI)},${lamp.on},${geometryRevision},${Math.round(roomLight(p.x, p.y) * 20)}`;
    if (key === this.last) return;
    this.last = key;
    for (let y = Math.floor(p.y - 11); y <= p.y + 11; y++)
      for (let x = Math.floor(p.x - 11); x <= p.x + 11; x++) {
        if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
        const center = { x: x + 0.5, y: y + 0.5 },
          id = y * SIZE + x;
        if (!inView(p, angle, center)) continue;
        if (!solid(x, y)) {
          if (perceived(p, angle, lamp, center, false)) {
            this.cells.add(id);
            this.blocked[this.level].delete(id);
          }
        } else {
          // Observe the near face rather than casting a ray into an opaque cell.
          const dx = p.x - center.x,
            dy = p.y - center.y;
          const sample =
            Math.abs(dx) > Math.abs(dy)
              ? { x: center.x + Math.sign(dx) * 0.512, y: center.y }
              : { x: center.x, y: center.y + Math.sign(dy) * 0.512 };
          if (
            !material(sample.x, sample.y) ||
            !perceived(p, angle, lamp, sample, false)
          )
            continue;
          if (material(x, y)) {
            this.cells.add(id);
            this.blocked[this.level].add(id);
          } else this.walls[this.level].add(id);
        }
      }
  }
  load(value: unknown) {
    this.floors.surface = this.valid(value, true);
    this.last = "";
  }
  private valid(value: unknown, floor = false) {
    if (
      !Array.isArray(value) ||
      value.length > SIZE * SIZE ||
      value.some(
        (n) =>
          !Number.isInteger(n) ||
          n < 0 ||
          n >= SIZE * SIZE ||
          (floor && !material(n % SIZE, Math.floor(n / SIZE))),
      )
    )
      throw Error("Invalid map");
    return new Set<number>(value);
  }
  encode(): Record<LevelId, LayerMemory> {
    const result = {} as Record<LevelId, LayerMemory>;
    for (const id of ["surface", "unknown"] as const)
      result[id] = {
        floor: [...this.floors[id]].sort((a, b) => a - b),
        walls: [...this.walls[id]].sort((a, b) => a - b),
        blocked: [...this.blocked[id]].sort((a, b) => a - b),
      };
    return result;
  }
  loadMaps(value: unknown) {
    const data = value as Record<LevelId, LayerMemory>;
    if (!data || typeof data !== "object") throw Error("Invalid maps");
    for (const id of ["surface", "unknown"] as const) {
      if (!data[id]) throw Error("Missing map");
      this.floors[id] = this.valid(data[id].floor, true);
      this.walls[id] = this.valid(data[id].walls);
      this.blocked[id] = this.valid(data[id].blocked, true);
      if ([...this.blocked[id]].some((n) => !this.floors[id].has(n)))
        throw Error("Unseen obstruction");
    }
    this.last = "";
  }
  draw(
    canvas: HTMLCanvasElement,
    player: Point,
    view: MapView = { zoom: 5, center: player, angle: 0 },
  ) {
    canvas.width = 360;
    canvas.height = 260;
    const c = canvas.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#000";
    c.fillRect(0, 0, 360, 260);
    const scale = view.zoom,
      ox = 180 - view.center.x * scale,
      oy = 130 - view.center.y * scale;
    const rect = (id: number, color: string) => {
      c.fillStyle = color;
      c.fillRect(
        Math.floor(ox + (id % SIZE) * scale),
        Math.floor(oy + Math.floor(id / SIZE) * scale),
        Math.ceil(scale),
        Math.ceil(scale),
      );
    };
    for (const id of this.cells) {
      const x = id % SIZE,
        y = Math.floor(id / SIZE),
        base = ZONES[zoneAt(x, y)].floor;
      rect(
        id,
        this.blocked[this.level].has(id)
          ? "#292c27"
          : `rgb(${base.map((n) => Math.round(n * 0.48)).join(",")})`,
      );
      if (isSafe(x, y) && scale >= 3) {
        c.fillStyle = "#526252";
        c.fillRect(
          Math.floor(ox + x * scale),
          Math.floor(oy + y * scale),
          Math.ceil(scale),
          1,
        );
      }
    }
    for (const id of this.walls[this.level]) rect(id, "#55594a");
    const known = IMPORTANT_PLACES.filter((p) =>
      this.cells.has(
        Math.floor(p.position.y) * SIZE + Math.floor(p.position.x),
      ),
    );
    for (const p of known) {
      const x = Math.round(ox + p.position.x * scale),
        y = Math.round(oy + p.position.y * scale);
      c.strokeStyle = "#a8a186";
      c.strokeRect(x - 3, y - 3, 6, 6);
      c.fillStyle = "#a8a186";
      c.font = "7px monospace";
      c.fillText(
        p.id === "home" ? "CASA" : p.id === "kitchen" ? "CUCINA" : "SOGGIORNO",
        x + 5,
        y + 2,
      );
    }
    const x = ox + player.x * scale,
      y = oy + player.y * scale;
    c.fillStyle = "#e0d6b0";
    c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    c.fillRect(
      Math.round(x + Math.cos(view.angle) * 5),
      Math.round(y + Math.sin(view.angle) * 5),
      2,
      2,
    );
    return [
      ...new Set(
        [...this.cells].map((id) => zoneAt(id % SIZE, Math.floor(id / SIZE))),
      ),
    ];
  }
}
