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
  const step = Math.sin(pose.stride) * pose.motion;
  const bob = Math.round(Math.abs(step));
  const bend = pose.action > 0 ? 1 : 0,
    lean = pose.load > 0.6 ? 1 : 0;
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
    rect(-5, -13, 3, 7, 110, -1);
    rect(-5, -12, 1, 5, 150, -1);
  }
  if (equipment.attached) {
    rect(-6, -12, 4, 6, 150, -1);
    rect(-6, -10, 4, 1, 85);
  }
  rect(-2, -13, 5, 5, pose.back ? 140 : 160);
  rect(-1 + Math.round(step * 0.4), -8, 3, 2, 140);
  rect(-3, -14, 6, 2, 165);
  rect(-1, -16, 2, 2, 180);
  rect(-2, -19, 4, 3, 195);
  rect(-2, -19, 4, 1, 100);
  if (pose.back) rect(-2, -18, 4, 2, 110);
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
