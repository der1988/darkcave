import { blocked } from "./movement";
import { ROOM } from "./room";
import type { Point } from "./geometry";

const CELL = 0.2;
const WIDTH = Math.floor(ROOM.width / CELL);
const HEIGHT = Math.floor(ROOM.height / CELL);
const center = (index: number): Point => ({
  x: ((index % WIDTH) + 0.5) * CELL,
  y: (Math.floor(index / WIDTH) + 0.5) * CELL,
});
const passable = Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
  const point = center(index);
  return (
    point.x >= 0.22 &&
    point.y >= 0.22 &&
    point.x <= ROOM.width - 0.22 &&
    point.y <= ROOM.height - 0.22 &&
    !blocked(point.x, point.y)
  );
});
function nearest(point: Point) {
  let best = -1,
    distance = Infinity;
  passable.forEach((open, index) => {
    if (!open) return;
    const cell = center(index),
      d = Math.hypot(cell.x - point.x, cell.y - point.y);
    if (d < distance) {
      best = index;
      distance = d;
    }
  });
  return best;
}
/** Cardinal grid search respects walls, doorway width and furniture footprints. */
export function findPath(from: Point, to: Point): Point[] {
  const start = nearest(from),
    goal = nearest(to);
  if (start < 0 || goal < 0) return [];
  const queue = [start],
    previous = new Map<number, number>([[start, -1]]);
  for (const cell of queue) {
    if (cell === goal) break;
    const x = cell % WIDTH,
      y = Math.floor(cell / WIDTH);
    for (const next of [
      x > 0 ? cell - 1 : -1,
      x < WIDTH - 1 ? cell + 1 : -1,
      y > 0 ? cell - WIDTH : -1,
      y < HEIGHT - 1 ? cell + WIDTH : -1,
    ]) {
      if (next < 0 || !passable[next] || previous.has(next)) continue;
      previous.set(next, cell);
      queue.push(next);
    }
  }
  if (!previous.has(goal)) return [];
  const route: Point[] = [];
  for (let cell = goal; cell !== start; cell = previous.get(cell)!)
    route.push(center(cell));
  route.push(center(start));
  return route.reverse();
}
