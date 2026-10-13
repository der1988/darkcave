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
  ...MEMORY_ROOMS.map((r) => ({ ...r, level: 0.7, safe: true })),
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
    safe: true,
    name: "The Empty Mall",
    x: 12,
    y: 25,
    w: 22,
    h: 16,
    level: 0.62,
  },
  {
    id: "playground",
    safe: true,
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
  { id: "mall-shutter-a", kind: "shutter", x: 13, y: 26, w: 4, d: 1, h: 1.15 },
  { id: "mall-shutter-b", kind: "shutter", x: 21, y: 26, w: 4, d: 1, h: 1.15 },
  { id: "mall-shutter-c", kind: "shutter", x: 29, y: 26, w: 3, d: 1, h: 1.15 },
];
// Ordinary domestic props, distinct from collectible furniture instances.
FURNITURE.push(
  { id: "home-bed", kind: "bed", x: 38, y: 46, w: 1, d: 2, h: 0.36 },
  { id: "kitchen-table", kind: "desk", x: 42, y: 13, w: 2, d: 1, h: 0.5 },
  { id: "kitchen-chair", kind: "chair", x: 42, y: 14, w: 1, d: 1, h: 0.27 },
  { id: "kitchen-cupboard", kind: "cabinet", x: 38, y: 9, w: 1, d: 3, h: 1 },
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
  { id: "living-sofa", kind: "sofa", x: 4, y: 50, w: 3, d: 1, h: 0.65 },
  { id: "living-tv", kind: "television", x: 8, y: 46, w: 1, d: 1, h: 0.65 },
  { id: "living-curtains", kind: "curtain", x: 3, y: 46, w: 1, d: 3, h: 1.1 },
  { id: "hotel-reception", kind: "desk", x: 15, y: 60, w: 3, d: 1, h: 0.7 },
  { id: "hotel-lounge", kind: "sofa", x: 14, y: 81, w: 3, d: 1, h: 0.65 },
  { id: "hotel-chair", kind: "armchair", x: 5, y: 72, w: 1, d: 1, h: 0.65 },
  { id: "service-pipes", kind: "cabinet", x: 76, y: 19, w: 1, d: 3, h: 1 },
);
for (const y of [61, 71, 81])
  FURNITURE.push({
    id: `hotel-door-${y}`,
    kind: "hotel-door",
    x: 9,
    y,
    w: 1,
    d: 1,
    h: 1.15,
    collision: false,
  });
export const ANOMALIES: Furniture[] = [
  {
    id: "a-armchair-wall",
    kind: "armchair",
    x: 49,
    y: 28,
    w: 1,
    d: 1,
    h: 0.7,
    visualOffset: [-0.55, 0, 0],
    clip: { axis: 0, minimum: 49 },
    parent: "yellow",
  },
  {
    id: "a-desk-column",
    kind: "desk",
    x: 59,
    y: 34,
    w: 3,
    d: 1,
    h: 0.55,
    visualOffset: [0.35, 0, 0],
    cutout: { x: 60, y: 34, w: 1, h: 2 },
    parent: "yellow",
  },
  {
    id: "a-service-lamp",
    kind: "lamp",
    x: 78,
    y: 19,
    w: 1,
    d: 1,
    h: 0.95,
    visualOffset: [0, 0, -0.38],
    parent: "service",
  },
  {
    id: "a-service-chair",
    kind: "chair",
    x: 89,
    y: 78,
    w: 1,
    d: 1,
    h: 0.3,
    visualOffset: [0, 0, 0.12],
    parent: "service",
  },
  {
    id: "a-parking-sofa",
    kind: "sofa",
    x: 54,
    y: 87,
    w: 3,
    d: 1,
    h: 0.7,
    visualOffset: [0, 0, -0.4],
    parent: "underground",
  },
  {
    id: "a-parking-frame",
    kind: "window",
    x: 59,
    y: 80,
    w: 1,
    d: 1,
    h: 0.7,
    visualOffset: [0.7, 0, 0.1],
    parent: "underground",
  },
  {
    id: "a-hotel-wardrobe",
    kind: "cabinet",
    x: 18,
    y: 70,
    w: 2,
    d: 1,
    h: 1.1,
    visualOffset: [0.45, -0.5, 0],
    parent: "hotel",
  },
  {
    id: "a-hotel-chair",
    kind: "armchair",
    x: 4,
    y: 85,
    w: 1,
    d: 1,
    h: 0.6,
    visualOffset: [0, 0.65, 0],
    parent: "hotel",
  },
  {
    id: "a-dark-phone",
    kind: "television",
    x: 71,
    y: 36,
    w: 1,
    d: 1,
    h: 0.25,
    visualOffset: [0, 0, 0.2],
    parent: "transition",
    collision: false,
  },
].map((a) => ({ ...a, anomaly: true }) as Furniture);
FURNITURE.push(...ANOMALIES);
const furnitureCells = new Set<string>();
for (const p of FURNITURE.filter((p) => p.collision !== false))
  for (let y = p.y; y < p.y + p.d; y++)
    for (let x = p.x; x < p.x + p.w; x++) furnitureCells.add(`${x},${y}`);
export const furnitureSolid = (x: number, y: number) =>
  furnitureCells.has(`${Math.floor(x)},${Math.floor(y)}`);
