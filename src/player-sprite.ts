import { project } from "./world";
import type { Gait } from "./movement";
export const directionFrame = (angle: number) => {
  const p = project(Math.cos(angle), Math.sin(angle));
  return (Math.round(Math.atan2(p.y, p.x) / (Math.PI / 4)) + 8) % 8;
};
export type Appearance = {
  backpack: boolean;
  bodyLight: boolean;
  harness: boolean;
  cargo: boolean;
  twoHanded: boolean;
  attached: boolean;
  tool: boolean;
};
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: {
    facing?: number;
    gait?: Gait;
    frightened?: boolean;
    stride: number;
    walking: boolean;
    motion: number;
    time: number;
    side: number;
    back: boolean;
    profile: boolean;
    load: number;
    action: number;
    light: boolean;
  },
  equipment: Appearance,
  shade: (tone: number, normal?: number) => string,
) {
  const frame =
    pose.facing === undefined
      ? pose.back
        ? 6
        : 2
      : directionFrame(pose.facing);
  const profiles = [true, false, false, false, true, false, false, false];
  const torsoWidths = [3, 4, 5, 4, 3, 4, 5, 4];
  const headOffsets = [1, 1, 0, -1, -1, -1, 0, 1];
  pose = {
    ...pose,
    profile: profiles[frame],
    back: frame >= 5,
    side: frame === 3 || frame === 4 || frame === 5 ? -1 : 1,
  };
  const step =
    Math.sin(Math.round(pose.stride * 3) / 3) *
    pose.motion *
    (pose.gait === "silent" ? 0.6 : pose.gait === "run" ? 1.25 : 1);
  const bob = Math.round(Math.abs(step));
  const bend = pose.action > 0 ? 1 : 0,
    lean = pose.load > 0.6 || pose.gait === "silent" ? 1 : 0;
  const breathe = !pose.walking && Math.sin(pose.time * 1.4) > 0.8 ? 1 : 0;
  const rect = (
    dx: number,
    dy: number,
    w: number,
    h: number,
    tone: number,
    n = 0,
  ) => {
    ctx.fillStyle = shade(tone, n);
    ctx.fillRect(
      x + dx + (dy < -7 ? lean : 0),
      y + dy - bob + (dy < -8 ? bend + breathe : 0),
      w,
      h,
    );
  };
  ctx.fillStyle = "#020302";
  ctx.fillRect(x - 4, y, 8, 1);
  const swing = Math.round(step * (pose.profile ? 2 : 1));
  rect(-2 + swing, -7, 1, 6 + Math.round(step), 155, -1);
  rect(1 - swing, -7, 1, 6 - Math.round(step), 165, 1);
  rect(-2 + swing, -2 + Math.round(step), 2, 1, 125, -1);
  rect(1 - swing, -2 - Math.round(step), 2, 1, 125, 1);
  if (equipment.backpack) {
    rect(pose.back ? -2 : -5, -13, pose.back ? 5 : 3, 7, 110, -1);
    rect(-5, -12, 1, 5, 150, -1);
  }
  if (equipment.attached) {
    rect(-6, -12, 4, 6, 150, -1);
    rect(-6, -10, 4, 1, 85);
  }
  rect(-2, -13, torsoWidths[frame], 5, pose.back ? 140 : 160);
  rect(-1 + Math.round(step * 0.4), -8, 3, 2, 140);
  rect(-3, -14, 6, 2, 165);
  rect(-1, -16, 2, 2, 180);
  rect(-2 + headOffsets[frame], -19, pose.profile ? 3 : 4, 3, 195);
  rect(-2 + headOffsets[frame], -19, pose.profile ? 3 : 4, 1, 100);
  if (pose.back) rect(-2 + headOffsets[frame], -18, 4, 2, 110);
  if (pose.profile) rect(headOffsets[frame] * 2, -17, 1, 1, 180);
  if (equipment.harness) {
    rect(-2, -13, 1, 5, 95);
    rect(2, -13, 1, 5, 95);
  }
  rect(-3, -13, 1, 4, 145, -1);
  rect(3, -13, 1, 4, 150, 1);
  if (equipment.cargo && equipment.twoHanded && !equipment.attached) {
    rect(-4, -10, 9, 6, 145);
    rect(-4, -10, 9, 1, 180);
    rect(0, -9, 1, 5, 85);
    rect(-4, -10, 1, 2, 195, -1);
    rect(4, -10, 1, 2, 195, 1);
  } else {
    rect(pose.side > 0 ? -4 : 3, -10 + Math.round(step), 1, 3, 175, -pose.side);
    rect(pose.side > 0 ? 3 : -4, -10, 2, 2, 175, pose.side);
    if (equipment.cargo && !equipment.attached) {
      rect(-6, -9, 4, 5, 145, -1);
      rect(-6, -9, 4, 1, 180, -1);
    }
    if (equipment.tool) rect(-5, -10, 1, 5, 160, -1);
  }
  if (equipment.bodyLight) {
    rect(2, -13, 2, 2, 195, 1);
    if (pose.light) {
      ctx.fillStyle = "#8f8765";
      ctx.fillRect(x + 3 + lean, y - 13 - bob, 1, 1);
    }
  } else if (!equipment.twoHanded) {
    ctx.fillStyle = pose.light ? "#8f8765" : "#050505";
    ctx.fillRect(x + (pose.side > 0 ? 5 : -6), y - 10 - bob, 2, 1);
  }
}

export function drawChild(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  stride: number,
  walking: boolean,
  time: number,
  gait: Gait,
  shade: (tone: number) => string,
) {
  const frame = directionFrame(heading),
    side = frame === 3 || frame === 4 || frame === 5 ? -1 : 1;
  const step = walking
    ? Math.round(
        Math.sin(Math.round(stride * 3) / 3) * (gait === "silent" ? 0.7 : 1),
      )
    : 0;
  const bob = walking && step !== 0 ? 1 : 0,
    lean = gait === "silent" ? 1 : 0;
  const rect = (dx: number, dy: number, w: number, h: number, t: number) => {
    ctx.fillStyle = shade(t);
    ctx.fillRect(x + dx + (dy < -4 ? lean : 0), y + dy - bob, w, h);
  };
  ctx.fillStyle = "#030403";
  ctx.fillRect(x - 3, y, 6, 1);
  rect(-2 + step, -4, 1, 4, 145);
  rect(1 - step, -4, 1, 4, 155);
  const head = [1, 1, 0, -1, -1, -1, 0, 1][frame],
    body = [2, 3, 4, 3, 2, 3, 4, 3][frame];
  rect(-2, -8, body, 4, 125);
  rect(-3, -8 + step, 1, 4, 155);
  rect(2, -8 - step, 1, 4, 155);
  rect(-1, -9, 2, 1, 180);
  rect(-2 + head, -12, frame === 0 || frame === 4 ? 3 : 4, 3, 185);
  rect(-2 + head, -12, frame === 0 || frame === 4 ? 3 : 4, 1, 90);
  if (frame >= 5) rect(-2 + head, -11, 4, 2, 100);
  if (!walking && Math.sin(time * 1.6) > 0.9) rect(side * 2, -7, 1, 1, 165);
}
