export type ZoneId =
  | "yellow"
  | "service"
  | "underground"
  | "mall"
  | "playground";
export const ZONES = {
  mall: {
    name: "The Empty Mall",
    floor: [141, 135, 118],
    wall: [165, 163, 145],
  },
  playground: {
    name: "The Forgotten Playground",
    floor: [97, 112, 99],
    wall: [151, 151, 128],
  },
  yellow: {
    name: "The Yellow Rooms",
    floor: [109, 100, 72],
    wall: [178, 166, 126],
  },
  service: {
    name: "The Service Areas",
    floor: [99, 103, 97],
    wall: [132, 145, 134],
  },
  underground: {
    name: "The Underground",
    floor: [85, 91, 92],
    wall: [127, 134, 135],
  },
};
export function zoneAt(x: number, y: number): ZoneId {
  if (x >= 8 && x < 37 && y >= 3 && y < 20) return "playground";
  if (x >= 12 && x < 34 && y >= 25 && y < 41) return "mall";
  return y >= 83 || (y >= 77 && x < 75)
    ? "underground"
    : x >= 75
      ? "service"
      : "yellow";
}
