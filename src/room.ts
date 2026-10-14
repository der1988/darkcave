/** World-space layout. All rooms share doors and one window-facing facade. */
export const ROOM = { width: 9.6, height: 3, wallHeight: 1.4 };
export type RoomZone = {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  floor: string;
};
export const ROOMS: RoomZone[] = [
  {
    id: "yellow",
    label: "STANZE GIALLE",
    minX: 0,
    maxX: 3.2,
    floor: "#201f16",
  },
  { id: "pool", label: "POOLROOMS", minX: 3.2, maxX: 6.4, floor: "#132021" },
  {
    id: "office",
    label: "UFFICIO VUOTO",
    minX: 6.4,
    maxX: 9.6,
    floor: "#191c19",
  },
];
export type Wall = { position: number; from: number; to: number };
export const DOORS = [3.2, 6.4].map((x) => ({ x, y: 1.5, width: 0.9 }));
export const WALLS: Wall[] = DOORS.flatMap((door) => [
  { position: door.x, from: 0, to: door.y - door.width / 2 },
  { position: door.x, from: door.y + door.width / 2, to: ROOM.height },
]);
export const WINDOWS = [
  { from: 0.55, to: 1.35 },
  { from: 3.65, to: 4.45 },
  { from: 5.15, to: 5.95 },
  { from: 7.25, to: 8.05 },
];
export const MARKINGS = [
  { x: 0.7, y: 0.75, width: 0.16, depth: 0.16, color: "#514d32" },
  { x: 2.45, y: 0.7, width: 0.16, depth: 0.16, color: "#514d32" },
  { x: 3.55, y: 0.48, width: 2.5, depth: 1.78, color: "#18383b" },
  { x: 3.7, y: 0.63, width: 2.2, depth: 1.48, color: "#28545a" },
  ...[6.72, 7.75, 8.72].map((x) => ({
    x,
    y: 0.62,
    width: 0.62,
    depth: 0.32,
    color: "#30352f",
  })),
];
