import { screenToWorld } from "./world";
export type Gait = "silent" | "walk" | "run";
export function motionInput(
  sx: number,
  sy: number,
  silent: boolean,
  running: boolean,
  load = 1,
  canRush = true,
) {
  const d = screenToWorld(sx, sy),
    n = Math.hypot(d.x, d.y);
  const gait: Gait = silent ? "silent" : running && canRush ? "run" : "walk";
  const speed =
    1.65 * (gait === "silent" ? 0.4 : gait === "run" ? 1.6 : 1) * load;
  return { x: n ? d.x / n : 0, y: n ? d.y / n : 0, speed, gait };
}
