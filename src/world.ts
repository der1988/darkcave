/** Hand-authored modules. Empty space is intentional; no random maze generation. */
export const SIZE = 112;
export const tiles = new Uint8Array(SIZE * SIZE);
function room(x: number, y: number, w: number, h: number, material = 1) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) tiles[j * SIZE + i] = material;
}
// Arrival hall, a procession of columns, and an oversized waiting room.
room(45, 46, 17, 14);
room(51, 39, 4, 7);
room(43, 24, 24, 15, 2);
room(48, 28, 1, 2, 0);
room(60, 28, 1, 2, 0);
room(48, 34, 1, 2, 0);
room(60, 34, 1, 2, 0);
room(49, 49, 1, 1, 0);
room(58, 49, 1, 1, 0);
room(49, 56, 1, 1, 0);
room(58, 56, 1, 1, 0);
// The east gallery folds around into a series of identical empty chambers.
room(62, 52, 24, 3);
room(77, 40, 9, 12, 3);
room(81, 29, 3, 11);
room(75, 17, 16, 12, 2);
room(67, 30, 14, 3);
room(86, 51, 8, 10);
room(86, 62, 8, 10);
room(86, 73, 8, 10);
room(88, 60, 2, 2);
room(88, 71, 2, 2);
// A compressed west passage opens into an unexpectedly enormous, offset atrium.
room(33, 53, 12, 2);
room(31, 41, 3, 14);
room(12, 25, 22, 16, 3);
room(17, 29, 2, 2, 0);
room(27, 29, 2, 2, 0);
room(17, 36, 2, 2, 0);
room(27, 36, 2, 2, 0);
room(34, 31, 9, 3);
room(20, 13, 3, 12);
room(14, 8, 18, 5, 2);
// Southern circuit: long silence, then a broad chamber split by a solid spine.
room(52, 60, 3, 17);
room(40, 77, 27, 15, 2);
room(51, 79, 2, 10, 0);
room(67, 84, 24, 3);
room(88, 83, 3, 1);
room(26, 84, 14, 3);
room(21, 67, 7, 20, 3);
room(24, 55, 2, 12);
room(24, 53, 9, 2);
// A few paths terminate without explanation.
room(64, 12, 3, 12);
room(60, 10, 11, 3);
room(91, 21, 9, 2);
// Service store and a gated underground extension, connected to the original rooms.
room(86, 45, 3, 1, 3);
room(89, 42, 7, 7, 3);
room(44, 80, 1, 2, 0);
room(44, 87, 1, 2, 0);
room(60, 80, 1, 2, 0);
room(60, 85, 1, 2, 0);
room(63, 92, 3, 6, 2);
room(57, 98, 20, 8, 2);
room(61, 101, 1, 2, 0);
room(71, 101, 1, 2, 0);
export let geometryRevision = 0;
const obstacles = new Set<number>();
export function setObstacles(points: { x: number; y: number }[]) {
  const next = new Set(
    points.map((p) => Math.floor(p.y) * SIZE + Math.floor(p.x)),
  );
  if (next.size === obstacles.size && [...next].every((n) => obstacles.has(n)))
    return;
  obstacles.clear();
  for (const n of next) obstacles.add(n);
  geometryRevision++;
}
export const spawn = { x: 53.5, y: 53.5 };
export function material(x: number, y: number): number {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 0;
  return tiles[Math.floor(y) * SIZE + Math.floor(x)];
}
export function solid(x: number, y: number): boolean {
  return (
    material(x, y) === 0 || obstacles.has(Math.floor(y) * SIZE + Math.floor(x))
  );
}

/** Grid DDA: stop at the first opaque cell, including columns. */
export function visible(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  let x = Math.floor(ax),
    y = Math.floor(ay);
  const ex = Math.floor(bx),
    ey = Math.floor(by);
  if (solid(x, y) || solid(ex, ey)) return false;
  const dx = bx - ax,
    dy = by - ay;
  const sx = dx >= 0 ? 1 : -1,
    sy = dy >= 0 ? 1 : -1;
  const tx = dx === 0 ? Infinity : Math.abs(1 / dx);
  const ty = dy === 0 ? Infinity : Math.abs(1 / dy);
  let mx = dx === 0 ? Infinity : ((sx > 0 ? x + 1 : x) - ax) / dx;
  let my = dy === 0 ? Infinity : ((sy > 0 ? y + 1 : y) - ay) / dy;
  while (x !== ex || y !== ey) {
    if (Math.abs(mx - my) < 1e-10) {
      // Do not let rays leak diagonally through a closed corner.
      if (solid(x + sx, y) || solid(x, y + sy)) return false;
      x += sx;
      y += sy;
      mx += tx;
      my += ty;
    } else if (mx < my) {
      x += sx;
      mx += tx;
    } else {
      y += sy;
      my += ty;
    }
    if (solid(x, y)) return false;
  }
  return true;
}
export const RADIUS = 0.19;
export function canStand(x: number, y: number): boolean {
  for (let j = Math.floor(y - RADIUS); j <= Math.floor(y + RADIUS); j++) {
    for (let i = Math.floor(x - RADIUS); i <= Math.floor(x + RADIUS); i++) {
      if (!solid(i, j)) continue;
      const dx = x - Math.max(i, Math.min(x, i + 1));
      const dy = y - Math.max(j, Math.min(y, j + 1));
      if (dx * dx + dy * dy < RADIUS * RADIUS) return false;
    }
  }
  return true;
}
export function move(p: { x: number; y: number }, dx: number, dy: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (RADIUS * 0.5)));
  for (let i = 0; i < steps; i++) {
    if (canStand(p.x + dx / steps, p.y)) p.x += dx / steps;
    if (canStand(p.x, p.y + dy / steps)) p.y += dy / steps;
  }
}
export function screenToWorld(x: number, y: number) {
  return { x: x / 48 + y / 24, y: y / 24 - x / 48 };
}
export function project(x: number, y: number, z = 0) {
  return { x: (x - y) * 24, y: (x + y) * 12 - z * 24 };
}
