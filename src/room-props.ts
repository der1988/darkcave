import type { LightOccluder } from "./flashlight";

export type RoomProp = LightOccluder & {
  id: string;
  kind: "armchair" | "table" | "chair" | "cabinet" | "lamp" | "box";
  height: number;
  color: [number, number, number];
  solid: boolean;
};

const prop = (
  id: RoomProp["id"], kind: RoomProp["kind"], x: number, y: number,
  width: number, depth: number, height: number,
  color: RoomProp["color"], solid = true,
): RoomProp => ({ id, kind, minX: x, minY: y, maxX: x + width,
  maxY: y + depth, height, color, solid });

export const ROOM_PROPS: RoomProp[] = [
  prop("chair-old", "armchair", 1.15, 1.15, .86, .72, .78, [74, 62, 52]),
  prop("low-table", "table", 3.02, 1.3, .92, .58, .42, [65, 55, 43]),
  prop("wrong-chair", "chair", 7.72, 2.15, .48, .5, .68, [55, 61, 57]),
  prop("sunken-cabinet", "cabinet", .18, 4.34, .72, 1.02, 1.23, [48, 53, 52]),
  prop("floor-lamp", "lamp", 6.72, 4.72, .25, .25, 1.13, [64, 61, 53]),
  prop("abandoned-box", "box", 5.16, 1.02, .62, .52, .48, [83, 69, 48]),
];

export const PROP_OCCLUDERS = ROOM_PROPS.filter((item) => item.solid);
