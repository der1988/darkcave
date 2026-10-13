import { HOME, contains, type Region } from "./levels";
import type { Point } from "./light";
import { ITEMS, type Item } from "./items";
export function itemCells(item: Item): Point[] {
  if (item.location.kind !== "world") return [];
  let [w, d] = ITEMS[item.def].footprint || [1, 1];
  if (item.rotation) [w, d] = [d, w];
  const p = item.location.position,
    result: Point[] = [];
  for (let y = 0; y < d; y++)
    for (let x = 0; x < w; x++)
      result.push({
        x: Math.floor(p.x) + x + 0.5,
        y: Math.floor(p.y) + y + 0.5,
      });
  return result;
}
export const protectedBaseCell = (p: Point) =>
  contains(HOME, p.x, p.y) &&
  (p.x < HOME.x + 2 || p.x >= HOME.x + HOME.w - 2 || p.y < HOME.y + 2);
export const footprintRegion = (i: Item): Region | null => {
  if (i.location.kind !== "world") return null;
  let [w, h] = ITEMS[i.def].footprint || [1, 1];
  if (i.rotation) [w, h] = [h, w];
  return {
    x: Math.floor(i.location.position.x),
    y: Math.floor(i.location.position.y),
    w,
    h,
  };
};
