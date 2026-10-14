import { VIEW } from "./config";
export type Point = { x: number; y: number };
export type SurfacePoint = [number, number, number];
export function project(x: number, y: number, z = 0): Point {
  return { x: (x - y) * VIEW.isoX, y: (x + y) * VIEW.isoY - z * VIEW.isoZ };
}
export function traceSurface(
  ctx: CanvasRenderingContext2D,
  points: SurfacePoint[],
  camera: Point,
) {
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const p = project(x, y, z);
    if (index) ctx.lineTo(p.x + camera.x, p.y + camera.y);
    else ctx.moveTo(p.x + camera.x, p.y + camera.y);
  });
  ctx.closePath();
}
