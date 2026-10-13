/** Authored stages: lighting and safe boundaries share these exact room extents. */
export type LitRoom = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
};
export const LIT_ROOMS: LitRoom[] = [
  {
    id: "waiting",
    name: "The Waiting Annex",
    x: 37,
    y: 44,
    w: 6,
    h: 6,
    level: 0.48,
  },
  {
    id: "mall",
    name: "The Empty Mall",
    x: 12,
    y: 25,
    w: 22,
    h: 16,
    level: 0.62,
  },
  {
    id: "playground",
    name: "The Forgotten Playground",
    x: 8,
    y: 3,
    w: 29,
    h: 17,
    level: 0.5,
  },
];
export function litRoomAt(x: number, y: number) {
  return LIT_ROOMS.find(
    (r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h,
  );
}
export const isSafe = (x: number, y: number) => !!litRoomAt(x, y);
/** Fixed, tired overhead lighting, with pools and dimmer edges; never leaks outside. */
export function roomLight(x: number, y: number, z = 0) {
  const r = litRoomAt(x, y);
  if (!r) return 0;
  const edge = Math.min(x - r.x, r.x + r.w - x, y - r.y, r.y + r.h - y);
  const pool =
    0.88 +
    0.12 *
      Math.cos(((x - r.x) * Math.PI) / 6) *
      Math.cos(((y - r.y) * Math.PI) / 5);
  return (
    r.level *
    pool *
    (0.68 + 0.32 * Math.min(1, edge / 2)) *
    (z > 0.2 ? 0.88 : 1)
  );
}
export type FurnitureKind =
  | "bench"
  | "planter"
  | "shutter"
  | "kiosk"
  | "fountain"
  | "swing"
  | "slide"
  | "roundabout"
  | "chair";
export type Furniture = {
  id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
};
export const FURNITURE: Furniture[] = [
  { id: "annex-chairs", kind: "chair", x: 38, y: 45, w: 1, d: 2, h: 0.45 },
  { id: "annex-table", kind: "kiosk", x: 40, y: 47, w: 1, d: 1, h: 0.42 },
  { id: "mall-shutter-a", kind: "shutter", x: 13, y: 26, w: 4, d: 1, h: 1.15 },
  { id: "mall-shutter-b", kind: "shutter", x: 21, y: 26, w: 4, d: 1, h: 1.15 },
  { id: "mall-shutter-c", kind: "shutter", x: 29, y: 26, w: 3, d: 1, h: 1.15 },
  { id: "mall-bench-a", kind: "bench", x: 20, y: 37, w: 3, d: 1, h: 0.27 },
  { id: "mall-bench-b", kind: "bench", x: 29, y: 35, w: 1, d: 3, h: 0.27 },
  { id: "mall-planter-a", kind: "planter", x: 14, y: 34, w: 1, d: 1, h: 0.42 },
  { id: "mall-planter-b", kind: "planter", x: 31, y: 30, w: 1, d: 1, h: 0.42 },
  { id: "mall-fountain", kind: "fountain", x: 22, y: 32, w: 3, d: 3, h: 0.28 },
  { id: "mall-kiosk", kind: "kiosk", x: 14, y: 30, w: 2, d: 2, h: 0.65 },
  { id: "play-swing", kind: "swing", x: 13, y: 8, w: 4, d: 2, h: 1.25 },
  { id: "play-slide", kind: "slide", x: 26, y: 10, w: 2, d: 4, h: 1 },
  {
    id: "play-roundabout",
    kind: "roundabout",
    x: 20,
    y: 6,
    w: 3,
    d: 3,
    h: 0.35,
  },
  { id: "play-bench-a", kind: "bench", x: 10, y: 16, w: 4, d: 1, h: 0.27 },
  { id: "play-bench-b", kind: "bench", x: 31, y: 5, w: 1, d: 3, h: 0.27 },
];
const furnitureCells = new Set<string>();
for (const p of FURNITURE)
  for (let y = p.y; y < p.y + p.d; y++)
    for (let x = p.x; x < p.x + p.w; x++) furnitureCells.add(`${x},${y}`);
export const furnitureSolid = (x: number, y: number) =>
  furnitureCells.has(`${Math.floor(x)},${Math.floor(y)}`);
