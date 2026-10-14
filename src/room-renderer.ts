import { LIGHT, ROOM_STYLE, VIEW } from "./config";
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
  viewport: { width: number; height: number; room: Room },
) {
  traceSurface(ctx, points, camera);
  ctx.fillStyle = ambient;
  ctx.fill();
  ctx.save();
  traceSurface(ctx, points, camera);
  ctx.clip();

  const lightOrigin = flashlight.origin(player);
  const origin = project(lightOrigin.x, lightOrigin.y, 0.34);
  const ox = origin.x + camera.x;
  const oy = origin.y + camera.y;
  const spillRadius = LIGHT.localSpillRadius * VIEW.isoX * 1.8;
  const ambientGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, spillRadius);
  ambientGlow.addColorStop(0, "rgba(47,51,49,.2)");
  ambientGlow.addColorStop(0.55, "rgba(30,34,34,.1)");
  ambientGlow.addColorStop(1, "rgba(16,19,21,0)");
  ctx.fillStyle = ambientGlow;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  if (flashlight.brightness > 0.01) {
    const range = flashlight.effectiveRange(lightOrigin, viewport.room);
    const target = flashlight.target(lightOrigin, viewport.room);
    const rgb = torchColor.join(",");

    for (let sample = 1; sample <= LIGHT.beamSamples; sample++) {
      const distance = (range * sample) / LIGHT.beamSamples;
      const position = project(
        lightOrigin.x + Math.cos(flashlight.angle) * distance,
        lightOrigin.y + Math.sin(flashlight.angle) * distance,
        0.015,
      );
      const px = position.x + camera.x;
      const py = position.y + camera.y;
      const radius =
        flashlight.beamRadius(distance) * LIGHT.coronaScale * VIEW.isoX;
      const beam = ctx.createRadialGradient(px, py, 0, px, py, radius);
      const alpha = flashlight.power(distance) * strength * 0.045;
      beam.addColorStop(0, `rgba(${rgb},${alpha})`);
      beam.addColorStop(0.55, `rgba(${rgb},${alpha * 0.42})`);
      beam.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const hitsWall = range < flashlight.range - 0.02;
    const spot = project(target.x, target.y, hitsWall ? 0.56 : 0.02);
    const sx = spot.x + camera.x;
    const sy = spot.y + camera.y;
    const radius = flashlight.spotRadius(range) * VIEW.isoX;
    const corona = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
    const coronaAlpha = Math.min(0.42, flashlight.power(range) * strength * 0.3);
    corona.addColorStop(0, `rgba(${rgb},${coronaAlpha})`);
    corona.addColorStop(0.5, `rgba(${rgb},${coronaAlpha * 0.62})`);
    corona.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();

    const hotspotRadius =
      flashlight.beamRadius(range) * LIGHT.hotspotScale * VIEW.isoX;
    const irregularX = Math.sin(flashlight.angle * 3.7) * 1.4;
    const irregularY = Math.cos(flashlight.angle * 2.9) * 1.1;
    const hotspot = ctx.createRadialGradient(
      sx + irregularX,
      sy + irregularY,
      0,
      sx,
      sy,
      hotspotRadius,
    );
    const hotspotAlpha = Math.min(
      0.88,
      flashlight.power(range) * strength * 0.72,
    );
    hotspot.addColorStop(0, `rgba(255,244,211,${hotspotAlpha})`);
    hotspot.addColorStop(0.38, `rgba(${rgb},${hotspotAlpha * 0.8})`);
    hotspot.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = hotspot;
    ctx.beginPath();
    ctx.arc(sx, sy, hotspotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  player: ActorState,
  flashlight: Flashlight,
  camera: Camera,
  viewport: { width: number; height: number; room: Room },
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
