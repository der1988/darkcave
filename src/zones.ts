import { HOME, MEMORY_ROOMS, contains, inDarkNetwork } from "./levels";
export type ZoneId =
  | "yellow"
  | "service"
  | "underground"
  | "mall"
  | "playground"
  | "hotel"
  | "home"
  | "memory"
  | "transition";
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
  home: {
    name: "La nostra stanza",
    floor: [151, 137, 108],
    wall: [167, 154, 127],
  },
  memory: {
    name: "Stanze dei ricordi",
    floor: [150, 128, 98],
    wall: [170, 153, 122],
  },
  hotel: {
    name: "Abandoned Hotel",
    floor: [121, 101, 91],
    wall: [143, 127, 108],
  },
  transition: {
    name: "Dark passages",
    floor: [90, 95, 88],
    wall: [110, 114, 103],
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
  if (contains(HOME, x, y)) return "home";
  if (MEMORY_ROOMS.some((r) => contains(r, x, y))) return "memory";
  if (inDarkNetwork(x, y)) return "transition";
  if (x >= 3 && x < 20 && y >= 60 && y < 92) return "hotel";
  if (x >= 8 && x < 37 && y >= 3 && y < 20) return "playground";
  if (x >= 12 && x < 34 && y >= 25 && y < 41) return "mall";
  return y >= 83 || (y >= 77 && x < 75)
    ? "underground"
    : x >= 75
      ? "service"
      : "yellow";
}
