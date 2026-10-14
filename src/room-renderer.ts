import { LIGHT, ROOM_STYLE } from "./config";
import { project, traceSurface, type Camera, type SurfacePoint } from "./geometry";
import type { Flashlight } from "./flashlight";
import type { ActorState } from "./native";

type Room = { width: number; height: number };
type Color = [number, number, number];

function drawSurface(
  ctx: CanvasRenderingContext2D,
  points: SurfacePoint[],
  ambient: string,
  torchColor: Color,
  strength: number,
  player: ActorState,
  flashlight: Flashlight,
  camera: Camera,
  viewport: { width: number; height: number },
) {
  traceSurface(ctx, points, camera);
  ctx.fillStyle = ambient;
  ctx.fill();
  ctx.save();
  traceSurface(ctx, points, camera);
  ctx.clip();

  const origin = project(player.x, player.y, 0.34);
  const ox = origin.x + camera.x;
  const oy = origin.y + camera.y;
  const ambientGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 155);
  ambientGlow.addColorStop(0, "rgba(42,48,49,.24)");
  ambientGlow.addColorStop(0.55, "rgba(30,35,37,.12)");
  ambientGlow.addColorStop(1, "rgba(16,19,21,0)");
  ctx.fillStyle = ambientGlow;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  if (flashlight.on) {
    const end = project(
      player.x + Math.cos(flashlight.angle) * flashlight.range,
      player.y + Math.sin(flashlight.angle) * flashlight.range,
    );
    const dx = end.x + camera.x - ox;
    const dy = end.y + camera.y - oy;
    const angle = Math.atan2(dy, dx);
    const radius = Math.max(1, Math.hypot(dx, dy));
    for (let layer = 0; layer < LIGHT.layers; layer++) {
      const halfAngle = 0.86 - layer * 0.047;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, radius, angle - halfAngle, angle + halfAngle);
      ctx.closePath();
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
      const alpha = flashlight.power() * strength * 0.074;
      const rgb = torchColor.join(",");
      glow.addColorStop(0, `rgba(${rgb},${alpha})`);
      glow.addColorStop(0.55, `rgba(${rgb},${alpha * 0.78})`);
      glow.addColorStop(0.87, `rgba(${rgb},${alpha * 0.34})`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = glow;
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  player: ActorState,
  flashlight: Flashlight,
  camera: Camera,
  viewport: { width: number; height: number },
) {
  const common = [player, flashlight, camera, viewport] as const;
  drawSurface(
    ctx,
    [[0, 0, 0], [room.width, 0, 0], [room.width, room.height, 0], [0, room.height, 0]],
    ROOM_STYLE.floor,
    [174, 166, 127],
    1,
    ...common,
  );
  drawSurface(
    ctx,
    [[0, 0, 0], [room.width, 0, 0], [room.width, 0, ROOM_STYLE.wallHeight], [0, 0, ROOM_STYLE.wallHeight]],
    ROOM_STYLE.backWall,
    [184, 176, 137],
    0.82,
    ...common,
  );
  drawSurface(
    ctx,
    [[0, 0, 0], [0, room.height, 0], [0, room.height, ROOM_STYLE.wallHeight], [0, 0, ROOM_STYLE.wallHeight]],
    ROOM_STYLE.sideWall,
    [165, 159, 128],
    0.72,
    ...common,
  );
}
