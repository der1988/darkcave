export type Point = { x: number; y: number };

export const ROOM = { x: 0, y: 0, w: 12, h: 9 } as const;
export const TILE_X = 32;
export const TILE_Y = 16;
export const TILE_Z = 32;
export const PLAYER_RADIUS = 0.18;
export const PLAYER_START: Point = { x: 6.2, y: 5 };
export const BROTHER_START: Point = { x: 5.7, y: 5.25 };

export function inside(x: number, y: number, margin = PLAYER_RADIUS) {
  return (
    x >= ROOM.x + margin &&
    y >= ROOM.y + margin &&
    x <= ROOM.x + ROOM.w - margin &&
    y <= ROOM.y + ROOM.h - margin
  );
}

export function move(p: Point, dx: number, dy: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 0.08));
  for (let i = 0; i < steps; i++) {
    if (inside(p.x + dx / steps, p.y)) p.x += dx / steps;
    if (inside(p.x, p.y + dy / steps)) p.y += dy / steps;
  }
}

export function project(x: number, y: number, z = 0) {
  return {
    x: (x - y) * TILE_X,
    y: (x + y) * TILE_Y - z * TILE_Z,
  };
}

export function screenToWorld(x: number, y: number) {
  return {
    x: x / (TILE_X * 2) + y / (TILE_Y * 2),
    y: y / (TILE_Y * 2) - x / (TILE_X * 2),
  };
}

export function visible(a: Point, b: Point) {
  return inside(a.x, a.y, 0) && inside(b.x, b.y, 0);
}
