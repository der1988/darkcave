import type { Point } from "./light";
export type Region = { x: number; y: number; w: number; h: number };
export const contains = (r: Region, x: number, y: number) =>
  x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
export const HOME = {
  id: "home",
  name: "La nostra stanza",
  x: 34,
  y: 45,
  w: 8,
  h: 6,
  spawn: { x: 39.5, y: 49.5 },
  child: { x: 39.6, y: 49.07 },
  entrance: { x: 41.5, y: 48.5 },
};
export const MEMORY_ROOMS = [
  {
    id: "kitchen",
    name: "La cucina",
    x: 38,
    y: 8,
    w: 8,
    h: 7,
    person: { x: 40.5, y: 11.5 },
    speaker: "Mamma",
    line: "Chiudete la porta, che entra freddo.",
    item: "memory-cup",
  },
  {
    id: "living",
    name: "Il soggiorno",
    x: 3,
    y: 45,
    w: 7,
    h: 7,
    person: { x: 5.5, y: 48.5 },
    speaker: "Papà",
    line: "Non state troppo vicini alla televisione.",
    item: "memory-photo",
  },
];
export const DARK_PASSAGES: Region[] = [
  { x: 40, y: 20, w: 33, h: 3 },
  { x: 40, y: 20, w: 3, h: 24 },
  { x: 70, y: 20, w: 3, h: 57 },
  { x: 40, y: 41, w: 33, h: 3 },
  { x: 51, y: 39, w: 4, h: 7 },
  { x: 62, y: 52, w: 24, h: 3 },
  { x: 52, y: 60, w: 3, h: 17 },
  { x: 20, y: 74, w: 53, h: 3 },
];
export const inDarkNetwork = (x: number, y: number) =>
  DARK_PASSAGES.some((r) => contains(r, x, y));
export const inHome = (p: Point) => contains(HOME, p.x, p.y);
export const LEVELS = {
  surface: {
    id: "surface",
    name: "LAYER 01 — THE SURFACE",
    implemented: true,
    layout: "surface-authored",
    themes: ["yellow", "service", "underground", "hotel"],
    darkNetwork: DARK_PASSAGES,
    memoryRooms: MEMORY_ROOMS,
    safeRoom: HOME,
    required: ["memory-cup", "memory-photo"],
    next: "unknown",
  },
  unknown: {
    id: "unknown",
    name: "LAYER 02 — UNKNOWN",
    implemented: false,
    layout: null,
    themes: [],
    darkNetwork: [],
    memoryRooms: [],
    safeRoom: HOME,
    required: [],
    next: null,
  },
} as const;
export type LevelId = keyof typeof LEVELS;
export type ChapterSave = {
  level: LevelId;
  facing: number;
  companion: Point;
  health: number;
  childHealth: number;
  events: string[];
  generatorOn: boolean;
};
export const freshChapter = (): ChapterSave => ({
  level: "surface",
  facing: -Math.PI / 2,
  companion: { ...HOME.child },
  health: 100,
  childHealth: 100,
  events: [],
  generatorOn: false,
});
export const IMPORTANT_PLACES = [
  { id: HOME.id, name: HOME.name, position: HOME.spawn },
  ...MEMORY_ROOMS.map((r) => ({
    id: r.id,
    name: r.name,
    position: { x: r.x + r.w / 2, y: r.y + r.h / 2 },
  })),
];
