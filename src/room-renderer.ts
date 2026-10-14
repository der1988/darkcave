import { LIGHT, ROOM_STYLE, VIEW } from "./config";
import { project, traceSurface, type Camera, type SurfacePoint } from "./geometry";
import type { Flashlight } from "./flashlight";
import type { ActorState } from "./game";
import { DOOR_MAX,DOOR_MIN,ZONES } from "./world";

type Room = { width: number; height: number };
type Color = [number, number, number];

function drawSurface(
  ctx: CanvasRenderingContext2D,
  points: SurfacePoint[],
  ambient: string,
  torchColor: Color,
  strength: number,
  distanceShade: number,
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
  const origin = project(lightOrigin.x, lightOrigin.y, LIGHT.lensHeight);
  const ox = origin.x + camera.x;
  const oy = origin.y + camera.y;
  const spillRadius = LIGHT.localSpillRadius * VIEW.isoX * 1.8;
  const ambientGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, spillRadius);
  ambientGlow.addColorStop(0, `rgba(66,70,65,${.025+flashlight.brightness*.21})`);
  ambientGlow.addColorStop(0.38, `rgba(39,43,40,${.012+flashlight.brightness*.09})`);
  ambientGlow.addColorStop(0.72, `rgba(25,28,27,${.008+flashlight.brightness*.027})`);
  ambientGlow.addColorStop(1, "rgba(16,19,21,0)");
  ctx.fillStyle = ambientGlow;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  if (flashlight.brightness > 0.01) {
    const range = flashlight.effectiveRange(lightOrigin, viewport.room);
    const target = flashlight.target(lightOrigin, viewport.room);
    const rgb = torchColor.join(",");

    const directionX=Math.cos(flashlight.angle);
    const directionY=Math.sin(flashlight.angle);
    const perpendicularX=-directionY;
    const perpendicularY=directionX;
    const endRadius=flashlight.beamRadius(range);
    for(const [width,alpha] of [[1.65,.05],[1.08,.08],[.62,.12]] as const){
      const left=project(target.x+perpendicularX*endRadius*width,target.y+perpendicularY*endRadius*width,.015);
      const right=project(target.x-perpendicularX*endRadius*width,target.y-perpendicularY*endRadius*width,.015);
      const gradient=ctx.createLinearGradient(ox,oy,(left.x+right.x)/2+camera.x,(left.y+right.y)/2+camera.y);
      gradient.addColorStop(0,`rgba(${rgb},${flashlight.brightness*strength*alpha*1.15})`);
      gradient.addColorStop(.28,`rgba(${rgb},${flashlight.brightness*strength*alpha*.78})`);
      gradient.addColorStop(.68,`rgba(${rgb},${flashlight.brightness*strength*alpha*.3})`);
      gradient.addColorStop(1,`rgba(${rgb},${flashlight.brightness*strength*alpha*.025})`);
      ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(left.x+camera.x,left.y+camera.y);
      ctx.lineTo(right.x+camera.x,right.y+camera.y);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    }

    for (let sample = 1; sample < LIGHT.beamSamples; sample++) {
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
      const alpha = flashlight.power(distance) * strength * 0.022;
      beam.addColorStop(0, `rgba(${rgb},${alpha})`);
      beam.addColorStop(0.55, `rgba(${rgb},${alpha * 0.42})`);
      beam.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

  }
  const darknessRadius=Math.max(viewport.width,viewport.height)*.72;
  const distanceDarkness=ctx.createRadialGradient(ox,oy,spillRadius*.35,ox,oy,darknessRadius);
  distanceDarkness.addColorStop(0,"rgba(0,0,0,0)");
  distanceDarkness.addColorStop(.35,"rgba(0,0,0,.055)");
  distanceDarkness.addColorStop(1,`rgba(0,0,0,${distanceShade})`);
  ctx.fillStyle=distanceDarkness;
  ctx.fillRect(0,0,viewport.width,viewport.height);
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
  const common=[player,flashlight,camera,viewport] as const;
  const style={
    lit:{floor:"#393a34",wall:"#4a4b43",side:"#41423b",shade:.04,strength:.8},
    dim:{floor:"#151918",wall:"#202521",side:"#1b211e",shade:.2,strength:.9},
    dark:{floor:ROOM_STYLE.floor,wall:ROOM_STYLE.backWall,side:ROOM_STYLE.sideWall,shade:.46,strength:1},
  } as const;
  for(const zone of ZONES){
    const look=style[zone.light];
    drawSurface(ctx,[[zone.minX,0,0],[zone.maxX,0,0],[zone.maxX,room.height,0],[zone.minX,room.height,0]],
      look.floor,[174,166,127],look.strength,look.shade,...common);
    drawSurface(ctx,[[zone.minX,0,0],[zone.maxX,0,0],[zone.maxX,0,ROOM_STYLE.wallHeight],[zone.minX,0,ROOM_STYLE.wallHeight]],
      look.wall,[184,176,137],look.strength*.82,look.shade,...common);
  }
  const first=style.lit;
  drawSurface(
    ctx,
    [[0, 0, 0], [0, room.height, 0], [0, room.height, ROOM_STYLE.wallHeight], [0, 0, ROOM_STYLE.wallHeight]],
    first.side,
    [165, 159, 128],
    0.6,
    first.shade,
    ...common,
  );
  for(const wallX of [4,8]){
    const wallColor=wallX===4?style.dim.wall:style.dark.wall;
    const shade=wallX===4?style.dim.shade:style.dark.shade;
    for(const [from,to] of [[0,DOOR_MIN],[DOOR_MAX,room.height]] as const)
      drawSurface(ctx,[[wallX,from,0],[wallX,to,0],[wallX,to,ROOM_STYLE.wallHeight],[wallX,from,ROOM_STYLE.wallHeight]],
        wallColor,[172,164,130],.72,shade,...common);
  }
  ctx.strokeStyle = ROOM_STYLE.edge;
  ctx.lineWidth = 1;
  const seams: [number, number, number][][] = [
    [[0,0,0],[room.width,0,0]],
    [[0,0,0],[0,room.height,0]],
    [[0,0,0],[0,0,ROOM_STYLE.wallHeight]],
  ];
  for (const seam of seams) {
    ctx.beginPath();
    seam.forEach(([x,y,z],index) => {
      const point=project(x,y,z);
      if(index) ctx.lineTo(point.x+camera.x,point.y+camera.y);
      else ctx.moveTo(point.x+camera.x,point.y+camera.y);
    });
    ctx.stroke();
  }
}
