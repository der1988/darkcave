/** World-space layout. Three directly connected spaces inside an empty shopping mall. */
export const ROOM = { width: 9.6, height: 3, wallHeight: 1.4 };
export type RoomZone = {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  floor: string;
};
export const ROOMS: RoomZone[] = [
  { id: "entrance", label: "INGRESSO", minX: 0, maxX: 3.2, floor: "#282825" },
  {
    id: "shops",
    label: "NEGOZI CHIUSI",
    minX: 3.2,
    maxX: 6.4,
    floor: "#272b29",
  },
  {
    id: "foodcourt",
    label: "AREA RISTORO",
    minX: 6.4,
    maxX: 9.6,
    floor: "#2b2826",
  },
];
export type Wall = { position: number; from: number; to: number };
export const DOORS = [3.2, 6.4].map((x) => ({ x, y: 1.5, width: 0.9 }));
export const WALLS: Wall[] = DOORS.flatMap((door) => [
  { position: door.x, from: 0, to: door.y - door.width / 2 },
  { position: door.x, from: door.y + door.width / 2, to: ROOM.height },
]);
/** Restrained floor inlays; no oversized furniture or permanent labels. */
export const MARKINGS = [
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
