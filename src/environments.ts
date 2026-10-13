import { HOME, MEMORY_ROOMS, contains, inDarkNetwork } from "./levels";
/** Authored stages: lighting and safe boundaries share these exact room extents. */
export type LitRoom = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
  safe?: boolean;
};
export const LIT_ROOMS: LitRoom[] = [
  { ...HOME, level: 0.62, safe: true },
  ...MEMORY_ROOMS.map((r) => ({ ...r, level: 0.7 })),
  {
    id: "yellow-north",
    name: "Yellow rooms",
    x: 43,
    y: 24,
    w: 24,
    h: 15,
    level: 0.3,
  },
  {
    id: "arrival",
    name: "Yellow rooms",
    x: 45,
    y: 46,
    w: 17,
    h: 14,
    level: 0.24,
  },
  {
    id: "service-north",
    name: "Service areas",
    x: 75,
    y: 17,
    w: 16,
    h: 12,
    level: 0.3,
  },
  {
    id: "service-store",
    name: "Service areas",
    x: 77,
    y: 40,
    w: 19,
    h: 12,
    level: 0.27,
  },
  {
    id: "service-south",
    name: "Service areas",
    x: 86,
    y: 51,
    w: 8,
    h: 32,
    level: 0.24,
  },
  {
    id: "parking",
    name: "Underground parking",
    x: 40,
    y: 77,
    w: 27,
    h: 15,
    level: 0.22,
  },
  {
    id: "hotel",
    name: "Abandoned hotel",
    x: 3,
    y: 60,
    w: 17,
    h: 32,
    level: 0.28,
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
export const isSafe = (x: number, y: number) =>
  LIT_ROOMS.some((r) => r.safe && contains(r, x, y));
export const pursuerForbidden = (x: number, y: number) =>
  !inDarkNetwork(x, y) || isSafe(x, y);
let homeBonus = 0;
export function homeEquipmentLight(powered: boolean) {
  homeBonus = powered ? 0.09 : 0;
}
/** Fixed, tired overhead lighting, with pools and dimmer edges; never leaks outside. */
export function roomLight(x: number, y: number, z = 0) {
  if (inDarkNetwork(x, y)) return 0;
  const r = litRoomAt(x, y);
  if (!r) return 0;
  const edge = Math.min(x - r.x, r.x + r.w - x, y - r.y, r.y + r.h - y);
  const pool =
    0.88 +
    0.12 *
      Math.cos(((x - r.x) * Math.PI) / 6) *
      Math.cos(((y - r.y) * Math.PI) / 5);
  return (
    (r.level + (r.id === HOME.id ? homeBonus : 0)) *
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
  | "chair"
  | "armchair"
  | "sofa"
  | "desk"
  | "cabinet"
  | "shelf"
  | "crate"
  | "generator"
  | "lamp"
  | "television"
  | "curtain"
  | "window"
  | "bed"
  | "hotel-door";
export type Furniture = {
  visualOffset?: [number, number, number];
  clip?: { axis: 0 | 1; minimum: number };
  cutout?: { x: number; y: number; w: number; h: number };
  anomaly?: boolean;
  parent?: string;
  rotation?: number;
  collision?: boolean;
  id: string;
  kind: FurnitureKind;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
};
export const FURNITURE: Furniture[] = [
  { id: "home-bed", kind: "bed", x: 38, y: 46, w: 1, d: 2, h: 0.36 },
  { id: "kitchen-table", kind: "desk", x: 42, y: 13, w: 1, d: 1, h: 0.45 },
  { id: "kitchen-chair", kind: "chair", x: 42, y: 14, w: 1, d: 1, h: 0.27 },
  { id: "kitchen-cupboard", kind: "cabinet", x: 38, y: 9, w: 1, d: 1, h: 0.82 },
  {
    id: "kitchen-window",
    kind: "window",
    x: 43,
    y: 8,
    w: 3,
    d: 1,
    h: 1.1,
    collision: false,
  },
];
export const ANOMALIES: Furniture[] = [];
const furnitureCells = new Set<string>();
for (const p of FURNITURE.filter((p) => p.collision !== false))
  for (let y = p.y; y < p.y + p.d; y++)
    for (let x = p.x; x < p.x + p.w; x++) furnitureCells.add(`${x},${y}`);
export const furnitureSolid = (x: number, y: number) =>
  furnitureCells.has(`${Math.floor(x)},${Math.floor(y)}`);
