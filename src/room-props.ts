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
  prop("shadow-test-cube", "box", 5.08, 1.02, .72, .72, .32, [83, 69, 48]),
];

export const PROP_OCCLUDERS = ROOM_PROPS.filter((item) => item.solid);
