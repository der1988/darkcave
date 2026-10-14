/** Layout transcribed from the two-wing level sketch, in world units. */
export const ROOM = { width: 15, height: 9, wallHeight: 1.4 };
export type RoomZone = {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  floor: string;
};
const zone = (
  id: string,
  label: string,
  x: number,
  y: number,
  floor: string,
): RoomZone => ({
  id,
  label,
  minX: x,
  maxX: x + 3,
  minY: y,
  maxY: y + 3,
  floor,
});
export const ROOMS: RoomZone[] = [
  zone("start", "INGRESSO", 0, 0, "#282825"),
  zone("computer", "CONTROLLO", 3, 0, "#272b29"),
  zone("left-middle", "VETRINE", 0, 3, "#282b2c"),
  zone("left-danger", "NEGOZI CHIUSI", 3, 3, "#272b29"),
  zone("left-bottom", "AREA RISTORO", 0, 6, "#2b2826"),
  zone("left-service", "SERVIZI", 3, 6, "#29282c"),
  zone("memory", "STANZA RICORDO", 6, 3, "#332a29"),
  zone("finish", "USCITA", 9, 0, "#282825"),
  zone("right-top", "NEGOZI", 12, 0, "#272b29"),
  zone("right-middle", "PIAZZETTA", 9, 3, "#2c2b27"),
  zone("right-danger", "VETRINE", 12, 3, "#282b2c"),
  zone("right-bottom", "RISTORO", 9, 6, "#2b2826"),
  zone("right-service", "GALLERIA", 12, 6, "#29282c"),
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
  locked?: boolean;
};
const door = (
  axis: Wall["axis"],
  x: number,
  y: number,
  a: string,
  b: string,
  locked = false,
): Door => ({ axis, x, y, width: 1, rooms: [a, b], locked });
export const DOORS: Door[] = [
  door("y", 1.5, 3, "start", "left-middle"),
  door("y", 4.5, 3, "computer", "left-danger"),
  door("y", 1.5, 6, "left-middle", "left-bottom"),
  door("y", 4.5, 6, "left-danger", "left-service"),
  door("x", 3, 7.5, "left-bottom", "left-service"),
  door("x", 6, 4.5, "left-danger", "memory", true),
  door("x", 9, 4.5, "memory", "right-middle"),
  door("x", 12, 1.5, "finish", "right-top"),
  door("y", 13.5, 3, "right-top", "right-danger"),
  door("y", 10.5, 6, "right-middle", "right-bottom"),
  door("y", 13.5, 6, "right-danger", "right-service"),
  door("x", 12, 7.5, "right-bottom", "right-service"),
];
function boundary(
  axis: Wall["axis"],
  position: number,
  from: number,
  to: number,
): Wall[] {
  const openings = DOORS.filter(
    (d) =>
      d.axis === axis &&
      (axis === "x" ? d.x : d.y) === position &&
      (axis === "x" ? d.y : d.x) > from &&
      (axis === "x" ? d.y : d.x) < to,
  ).sort((a, b) => (axis === "x" ? a.y - b.y : a.x - b.x));
  const result: Wall[] = [];
  let cursor = from;
  for (const d of openings) {
    const center = axis === "x" ? d.y : d.x;
    result.push({ axis, position, from: cursor, to: center - d.width / 2 });
    cursor = center + d.width / 2;
  }
  if (cursor < to) result.push({ axis, position, from: cursor, to });
  return result;
}
export const WALLS: Wall[] = [
  ...boundary("x", 3, 0, 9),
  ...boundary("x", 12, 0, 9),
  ...boundary("y", 3, 0, 6),
  ...boundary("y", 6, 0, 6),
  ...boundary("y", 3, 9, 15),
  ...boundary("y", 6, 9, 15),
  ...boundary("x", 6, 0, 9),
  ...boundary("x", 9, 0, 9),
  { axis: "y", position: 3, from: 6, to: 9 },
  { axis: "y", position: 6, from: 6, to: 9 },
  { axis: "x", position: 0, from: 0, to: 9 },
  { axis: "y", position: 0, from: 0, to: 6 },
  { axis: "y", position: 0, from: 9, to: 15 },
];
export const MEMORY_GATE: Wall = { axis: "x", position: 6, from: 4, to: 5 };
export function wallsFor(unlocked = false) {
  return unlocked ? WALLS : [...WALLS, MEMORY_GATE];
}
export function roomAt(x: number, y: number) {
  return ROOMS.find(
    (r) => x >= r.minX && x < r.maxX && y >= r.minY && y < r.maxY,
  );
}
export const COMPUTER = { x: 4.5, y: 0.72 };
export const MEMORY = { x: 7.5, y: 4.5 };
export const EXIT = { x: 10.5, y: 0.72 };
export const CLICKER_SPAWNS = [
  { x: 4.1, y: 4.2 },
  { x: 4.9, y: 5.15 },
  { x: 1.3, y: 7.8 },
  { x: 13.5, y: 4.5 },
  { x: 10.5, y: 7.5 },
  { x: 13, y: 7 },
  { x: 14, y: 8 },
];
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
    x: COMPUTER.x - 0.3,
    y: COMPUTER.y - 0.2,
    width: 0.6,
    depth: 0.4,
    height: 0.42,
    color: "#50504a",
    kind: "computer",
  },
  {
    x: 0.35,
    y: 4.35,
    width: 0.9,
    depth: 0.28,
    height: 0.22,
    color: "#514940",
    kind: "bench",
  },
  {
    x: 3.45,
    y: 7.9,
    width: 0.65,
    depth: 0.4,
    height: 0.42,
    color: "#344346",
    kind: "display",
  },
  {
    x: 0.35,
    y: 6.4,
    width: 1.1,
    depth: 0.35,
    height: 0.35,
    color: "#534a40",
    kind: "counter",
  },
  {
    x: 9.4,
    y: 4.1,
    width: 0.6,
    depth: 0.4,
    height: 0.42,
    color: "#50504a",
    kind: "directory",
  },
  {
    x: 12.4,
    y: 0.4,
    width: 0.6,
    depth: 0.4,
    height: 0.5,
    color: "#344346",
    kind: "display",
  },
  {
    x: 14.3,
    y: 6.4,
    width: 0.35,
    depth: 0.35,
    height: 0.3,
    color: "#414b42",
    kind: "planter",
  },
];
export const MARKINGS = ROOMS.flatMap((room) => [
  {
    x: room.minX + 0.3,
    y: room.minY + 0.35,
    width: 2.4,
    depth: 0.07,
    color: "#373936",
  },
  {
    x: room.minX + 0.3,
    y: room.maxY - 0.4,
    width: 2.4,
    depth: 0.07,
    color: "#373936",
  },
]);
export const STOREFRONTS = [0.5, 3.55, 9.55, 12.5].map((from) => ({
  from,
  to: from + 1.95,
  trim: "#474942",
  sign: "#363d3c",
}));
