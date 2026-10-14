import { LIGHT } from "./config";
import type { Flashlight } from "./flashlight";
import { project, type Camera, type Point } from "./geometry";
import type { ActorState } from "./game";
import { drawPerson } from "./player-sprite";
import { WALLS,zoneAt } from "./world";

type Room = { width: number; height: number };

export function wallOpacity(actor:ActorState){
  for(const wall of WALLS){
    const across=wall.axis==="x"?actor.x:actor.y,along=wall.axis==="x"?actor.y:actor.x;
    if(across<wall.position&&wall.position-across<.85&&along>=wall.from&&along<=wall.to)return .42;
  }
  return 1;
}

function drawBrotherShadow(
  ctx: CanvasRenderingContext2D,
  player: ActorState,
  brother: ActorState,
  flashlight: Flashlight,
  camera: Camera,
  room: Room,
) {
  const origin = flashlight.origin(player);
  const illumination = flashlight.at(brother, origin, room);
  if (illumination < 0.08) return;
  const dx = brother.x - origin.x;
  const dy = brother.y - origin.y;
  const magnitude = Math.hypot(dx, dy) || 1;
  const ux = dx / magnitude;
  const uy = dy / magnitude;
  const px = -uy;
  const py = ux;
  const length = 0.55 + Math.min(1.1, illumination * 0.7);
  const width = 0.12;
  const points: Point[] = [
    { x: brother.x + px * width, y: brother.y + py * width },
    { x: brother.x - px * width, y: brother.y - py * width },
    { x: brother.x + ux * length - px * 0.025, y: brother.y + uy * length - py * 0.025 },
    { x: brother.x + ux * (length + 0.12), y: brother.y + uy * (length + 0.12) },
    { x: brother.x + ux * length + px * 0.025, y: brother.y + uy * length + py * 0.025 },
  ];
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = project(point.x, point.y, 0.004);
    if (index) ctx.lineTo(screen.x + camera.x, screen.y + camera.y);
    else ctx.moveTo(screen.x + camera.x, screen.y + camera.y);
  });
  ctx.closePath();
  const base = project(brother.x, brother.y);
  const tip = project(brother.x + ux * length, brother.y + uy * length);
  const shadow = ctx.createLinearGradient(
    base.x + camera.x,
    base.y + camera.y,
    tip.x + camera.x,
    tip.y + camera.y,
  );
  shadow.addColorStop(0, "rgba(0,0,0,.48)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fill();
}

export function drawActors(
  ctx: CanvasRenderingContext2D,
  player: ActorState,
  brother: ActorState,
  flashlight: Flashlight,
  camera: Camera,
  now: number,
  room: Room,
) {
  const lightOrigin = flashlight.origin(player);
  const roomLight=(actor:ActorState)=>zoneAt(actor.x,actor.y)?.ambient??.03;
  drawBrotherShadow(ctx, player, brother, flashlight, camera, room);
  const actors = [
    { actor: player, child: false, light: roomLight(player)+flashlight.brightness*.12 },
    { actor: brother, child: true, light: roomLight(brother)+flashlight.at(brother, lightOrigin, room)*.82 },
  ].sort((a, b) => a.actor.x + a.actor.y - b.actor.x - b.actor.y);
  for (const { actor, child, light } of actors) {
    const screen = project(actor.x, actor.y);
    const lens = !child && flashlight.holdProgress > 0.02
      ? project(lightOrigin.x, lightOrigin.y, LIGHT.lensHeight-(player.stealth?.1:0))
      : undefined;
    drawPerson(
      ctx,
      Math.round(screen.x + camera.x),
      Math.round(screen.y + camera.y),
      actor.heading,
      actor.stride,
      child,
      Math.min(1.15, light),
      now / 1000,
      actor.moving,
      lens ? { x: lens.x + camera.x, y: lens.y + camera.y } : undefined,
      child ? 0 : flashlight.holdProgress,
      actor.stealth,
      wallOpacity(actor),
    );
  }
}
