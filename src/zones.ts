export type ZoneId = "yellow" | "service" | "underground";
export const ZONES = {
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
  return y >= 83 || (y >= 77 && x < 75) ? "underground" : x >= 75 ? "service" : "yellow";
}
