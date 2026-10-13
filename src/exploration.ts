import { SIZE, material, solid, visible, geometryRevision } from "./world";
import type { Point } from "./light";
import { zoneAt, ZONES } from "./zones";
import { isSafe } from "./environments";
/** Persistent memory of nearby traversable space; no access to creatures or loot. */
export class Exploration {
  cells = new Set<number>();
  private last = "";
  visit(p: Point) {
    const key = `${Math.floor(p.x * 2)},${Math.floor(p.y * 2)},${geometryRevision}`;
    if (key === this.last) return;
    this.last = key;
    for (let y = Math.floor(p.y - 4); y <= p.y + 4; y++)
      for (let x = Math.floor(p.x - 4); x <= p.x + 4; x++) {
        if (!material(x, y) || Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) > 4.2)
          continue;
        if (visible(p.x, p.y, x + 0.5, y + 0.5)) this.cells.add(y * SIZE + x);
      }
  }
  load(value: unknown) {
    if (
      !Array.isArray(value) ||
      value.length > SIZE * SIZE ||
      value.some(
        (n) =>
          !Number.isInteger(n) ||
          n < 0 ||
          n >= SIZE * SIZE ||
          !material(n % SIZE, Math.floor(n / SIZE)),
      )
    )
      throw Error("Invalid exploration data");
    this.cells = new Set(value);
    this.last = "";
  }
  draw(canvas: HTMLCanvasElement, player: Point) {
    canvas.width = 360;
    canvas.height = 300;
    const c = canvas.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#080b09";
    c.fillRect(0, 0, 360, 300);
    const xs = [Math.floor(player.x)],
      ys = [Math.floor(player.y)];
    for (const id of this.cells) {
      xs.push(id % SIZE);
      ys.push(Math.floor(id / SIZE));
    }
    const minX = Math.min(...xs) - 3,
      minY = Math.min(...ys) - 3,
      maxX = Math.max(...xs) + 4,
      maxY = Math.max(...ys) + 4;
    const scale = Math.min(
      9,
      Math.floor(Math.min(340 / (maxX - minX), 280 / (maxY - minY))),
    );
    const ox = Math.floor((360 - (maxX - minX) * scale) / 2),
      oy = Math.floor((300 - (maxY - minY) * scale) / 2);
    for (const id of this.cells) {
      const x = id % SIZE,
        y = Math.floor(id / SIZE),
        base = ZONES[zoneAt(x, y)].floor;
      c.fillStyle = solid(x, y)
        ? "#333b32"
        : `rgb(${base.map((n) => Math.round(n * 0.62)).join(",")})`;
      c.fillRect(
        ox + (x - minX) * scale,
        oy + (y - minY) * scale,
        scale,
        scale,
      );
      if (isSafe(x, y)) {
        c.fillStyle = "#718473";
        c.fillRect(
          ox + (x - minX) * scale,
          oy + (y - minY) * scale,
          Math.max(1, scale - 1),
          1,
        );
      }
    }
    const x = ox + (player.x - minX) * scale,
      y = oy + (player.y - minY) * scale;
    c.fillStyle = "#ddd5ae";
    c.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    return [
      ...new Set(
        [...this.cells].map((id) => zoneAt(id % SIZE, Math.floor(id / SIZE))),
      ),
    ];
  }
}
