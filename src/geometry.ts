import { VIEW } from "./config";

export type Point = { x: number; y: number };
export type SurfacePoint = [number, number, number];
export type Camera = { x: number; y: number };

export function project(x: number, y: number, z = 0): Point {
  return {
    x: (x - y) * VIEW.isoX,
    y: (x + y) * VIEW.isoY - z * VIEW.isoZ,
  };
}

export function screenToWorld(x: number, y: number): Point {
  return {
    x: x / (VIEW.isoX * 2) + y / (VIEW.isoY * 2),
    y: y / (VIEW.isoY * 2) - x / (VIEW.isoX * 2),
  };
}

export function traceSurface(
  ctx: CanvasRenderingContext2D,
  points: SurfacePoint[],
  camera: Camera,
) {
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const p = project(x, y, z);
    if (index) ctx.lineTo(p.x + camera.x, p.y + camera.y);
    else ctx.moveTo(p.x + camera.x, p.y + camera.y);
  });
  ctx.closePath();
}
