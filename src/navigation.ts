import { SIZE, solid } from "./world";
import type { Point } from "./light";
const id = (p: Point) => Math.floor(p.y) * SIZE + Math.floor(p.x);
/** Cardinal navigation avoids corner cutting; waypoints lie in safe cell centers. */
export function pathfind(from: Point, to: Point): Point[] {
  if (solid(from.x, from.y) || solid(to.x, to.y)) return [];
  const start = id(from),
    goal = id(to),
    parent = new Int32Array(SIZE * SIZE).fill(-1);
  const queue = [start];
  parent[start] = start;
  for (let i = 0; i < queue.length && parent[goal] === -1; i++) {
    const n = queue[i],
      x = n % SIZE,
      y = Math.floor(n / SIZE);
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      const next = ny * SIZE + nx;
      if (solid(nx, ny) || parent[next] !== -1) continue;
      parent[next] = n;
      queue.push(next);
    }
  }
  if (parent[goal] === -1) return [];
  const route: Point[] = [];
  for (let n = goal; n !== start; n = parent[n])
    route.push({ x: (n % SIZE) + 0.5, y: Math.floor(n / SIZE) + 0.5 });
  route.push({ x: Math.floor(from.x) + 0.5, y: Math.floor(from.y) + 0.5 });
  route.reverse();
  route.push({ ...to });
  return route;
}
export function nearbyDestinations(center: Point, radius: number): Point[] {
  const points: Point[] = [];
  for (let y = Math.floor(center.y - radius); y <= center.y + radius; y++)
    for (let x = Math.floor(center.x - radius); x <= center.x + radius; x++)
      if (
        !solid(x, y) &&
        Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y) <= radius
      )
        points.push({ x: x + 0.5, y: y + 0.5 });
  return points;
}
