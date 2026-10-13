import { screenToWorld, type Point } from "./world";

export function movementVector(horizontal: number, vertical: number): Point {
  if (!horizontal && !vertical) return { x: 0, y: 0 };
  const world = screenToWorld(horizontal, vertical);
  const length = Math.hypot(world.x, world.y);
  return { x: world.x / length, y: world.y / length };
}

export function movementSpeed(running: boolean) {
  return running ? 3.05 : 2.15;
}
