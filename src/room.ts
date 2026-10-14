/** World-space layout. Six directly connected spaces inside an empty shopping mall. */
export const ROOM = { width: 9.6, height: 9.6, wallHeight: 1.4 };
export type RoomZone = {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  floor: string;
  minY: number;
  maxY: number;
};
export const ROOMS: RoomZone[] = [
  {
    id: "entrance",
    label: "INGRESSO",
    minX: 0,
    maxX: 3.2,
    minY: 0,
    maxY: 4.8,
    floor: "#282825",
  },
  {
    id: "shops",
    label: "NEGOZI CHIUSI",
    minX: 3.2,
    maxX: 6.4,
    minY: 0,
    maxY: 4.8,
    floor: "#272b29",
  },
  {
    id: "foodcourt",
    label: "AREA RISTORO",
    minX: 6.4,
    maxX: 9.6,
    minY: 0,
    maxY: 4.8,
    floor: "#2b2826",
  },
  {
    id: "boutiques",
    label: "VETRINE VUOTE",
    minX: 0,
    maxX: 3.2,
    minY: 4.8,
    maxY: 9.6,
    floor: "#282b2c",
  },
  {
    id: "atrium",
    label: "PIAZZETTA",
    minX: 3.2,
    maxX: 6.4,
    minY: 4.8,
    maxY: 9.6,
    floor: "#2c2b27",
  },
  {
    id: "arcade",
    label: "GALLERIA CHIUSA",
    minX: 6.4,
    maxX: 9.6,
    minY: 4.8,
    maxY: 9.6,
    floor: "#29282c",
  },
];
export type Wall = {
  axis: "x" | "y";
  position: number;
  from: number;
  to: number;
};
export type Door = {
  x: number;
  y: number;
  width: number;
  axis: Wall["axis"];
  rooms: [string, string];
};
export const DOORS: Door[] = [
  { x: 3.2, y: 1.5, width: 0.9, axis: "x", rooms: ["entrance", "shops"] },
  { x: 6.4, y: 1.5, width: 0.9, axis: "x", rooms: ["shops", "foodcourt"] },
  { x: 3.2, y: 7.2, width: 0.9, axis: "x", rooms: ["boutiques", "atrium"] },
  { x: 6.4, y: 7.2, width: 0.9, axis: "x", rooms: ["atrium", "arcade"] },
  { x: 1.6, y: 4.8, width: 1, axis: "y", rooms: ["entrance", "boutiques"] },
  { x: 4.8, y: 4.8, width: 1, axis: "y", rooms: ["shops", "atrium"] },
  { x: 8, y: 4.8, width: 1, axis: "y", rooms: ["foodcourt", "arcade"] },
];
export const WALLS: Wall[] = DOORS.flatMap((door) => {
  const along = door.axis === "x" ? door.y : door.x;
  const from =
    door.axis === "x"
      ? door.y < 4.8
        ? 0
        : 4.8
      : Math.floor(door.x / 3.2) * 3.2;
  const to = from + (door.axis === "x" ? 4.8 : 3.2);
  return [
    {
      axis: door.axis,
      position: door.axis === "x" ? door.x : door.y,
      from,
      to: along - door.width / 2,
    },
    {
      axis: door.axis,
      position: door.axis === "x" ? door.x : door.y,
      from: along + door.width / 2,
      to,
    },
  ];
});
export function roomAt(x: number, y: number) {
  return ROOMS.find(
    (room) =>
      x >= room.minX && x < room.maxX && y >= room.minY && y < room.maxY,
  )!;
}
export type Fixture = {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  kind: string;
};
export const FIXTURES: Fixture[] = [
  {
    x: 0.35,
    y: 2.8,
    width: 1.05,
    depth: 0.28,
    height: 0.22,
    color: "#514940",
    kind: "bench",
  },
  {
    x: 2.45,
    y: 3.3,
    width: 0.32,
    depth: 0.32,
    height: 0.34,
    color: "#414b42",
    kind: "planter",
  },
  {
    x: 3.65,
    y: 3.3,
    width: 0.72,
    depth: 0.42,
    height: 0.48,
    color: "#50504a",
    kind: "directory",
  },
  {
    x: 7.05,
    y: 0.35,
    width: 1.7,
    depth: 0.4,
    height: 0.38,
    color: "#534a40",
    kind: "counter",
  },
  {
    x: 7.2,
    y: 2.65,
    width: 0.55,
    depth: 0.55,
    height: 0.3,
    color: "#4b4841",
    kind: "table",
  },
  {
    x: 0.35,
    y: 5.4,
    width: 0.5,
    depth: 0.7,
    height: 0.52,
    color: "#344346",
    kind: "display",
  },
  {
    x: 2.4,
    y: 8.3,
    width: 0.36,
    depth: 0.36,
    height: 0.34,
    color: "#424b42",
    kind: "planter",
  },
  {
    x: 4.05,
    y: 8.35,
    width: 1.35,
    depth: 0.3,
    height: 0.22,
    color: "#514940",
    kind: "bench",
  },
  {
    x: 5.75,
    y: 5.7,
    width: 0.32,
    depth: 0.32,
    height: 0.34,
    color: "#414b42",
    kind: "planter",
  },
  {
    x: 7.2,
    y: 8.4,
    width: 1.2,
    depth: 0.45,
    height: 0.44,
    color: "#4d474b",
    kind: "kiosk",
  },
];
/** Restrained floor inlays; no oversized furniture or permanent labels. */
export const MARKINGS = [
  ...ROOMS.filter((room) => room.minY > 0).flatMap((room) => [
    {
      x: room.minX + 0.3,
      y: room.minY + 0.38,
      width: 2.6,
      depth: 0.08,
      color: "#3a3b36",
    },
    {
      x: room.minX + 0.3,
      y: room.maxY - 0.42,
      width: 2.6,
      depth: 0.08,
      color: "#3a3b36",
    },
  ]),
  { x: 0.35, y: 0.35, width: 2.5, depth: 0.08, color: "#373936" },
  { x: 0.35, y: 2.57, width: 2.5, depth: 0.08, color: "#373936" },
  { x: 1.14, y: 1.12, width: 0.92, depth: 0.72, color: "#313330" },
  { x: 3.48, y: 0.38, width: 2.62, depth: 0.08, color: "#39403a" },
  { x: 3.48, y: 2.54, width: 2.62, depth: 0.08, color: "#39403a" },
  { x: 6.68, y: 0.38, width: 2.62, depth: 0.08, color: "#3b3631" },
  { x: 6.68, y: 2.54, width: 2.62, depth: 0.08, color: "#3b3631" },
];
/** Closed storefronts on the back wall: signs and shutters are surface materials. */
export const STOREFRONTS = [
  { from: 0.6, to: 2.55, trim: "#474942", sign: "#363d3c" },
  { from: 3.58, to: 4.7, trim: "#424a44", sign: "#46504b" },
  { from: 4.98, to: 6.08, trim: "#424a44", sign: "#514b40" },
  { from: 6.82, to: 9.12, trim: "#4c453e", sign: "#51463f" },
];
