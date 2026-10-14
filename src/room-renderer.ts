import { LIGHT, ROOM_STYLE, VIEW } from "./config";
import { project, traceSurface, type Camera, type SurfacePoint } from "./geometry";
import type { Flashlight } from "./flashlight";
import type { ActorState } from "./game";
import { WALLS,ZONES,zoneAt,type Zone } from "./world";

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
  const origin = project(lightOrigin.x, lightOrigin.y, LIGHT.lensHeight-(player.stealth?.1:0));
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
    const impactZ=range<flashlight.range-.02?.58:.015;
    const rgb = torchColor.join(",");

    const directionX=Math.cos(flashlight.angle);
    const directionY=Math.sin(flashlight.angle);
    const perpendicularX=-directionY;
    const perpendicularY=directionX;
    const endRadius=flashlight.beamRadius(range);
    for(const [width,alpha] of [[1.65,.05],[1.08,.08],[.62,.12]] as const){
      const left=project(target.x+perpendicularX*endRadius*width,target.y+perpendicularY*endRadius*width,impactZ);
      const right=project(target.x-perpendicularX*endRadius*width,target.y-perpendicularY*endRadius*width,impactZ);
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

function drawCharacteristics(ctx:CanvasRenderingContext2D,zone:Zone,player:ActorState,
  flashlight:Flashlight,camera:Camera,room:Room){
  const patterns:Record<string,[number,number,number,number][]>={
    arrival:[[1.55,1.12,.9,.66]],
    yellow:[[.55,.55,.12,1.9],[1.35,.55,.12,1.9],[2.15,.55,.12,1.9],[2.95,.55,.12,1.9]],
    service:[[.65,.72,.55,.1],[1.35,1.05,.55,.1],[2.05,1.38,.55,.1]],
    threshold:[[.6,.62,.72,.72],[2.55,1.65,.72,.72]],
    white:[[1.12,.72,1.75,1.55]],
    carpet:[[.35,.42,3.3,.16],[.35,2.42,3.3,.16]],
    storage:[[.55,.55,.38,.38],[1.35,1.15,.38,.38],[2.2,.62,.38,.38],[2.85,1.78,.38,.38]],
    return:[[.55,.55,.18,1.75],[.55,2.12,2.45,.18]],
  };
  const center={x:(zone.minX+zone.maxX)/2,y:(zone.minY+zone.maxY)/2};
  const illumination=flashlight.at(center,flashlight.origin(player),room);
  ctx.save();ctx.globalAlpha=Math.min(.34,.05+zone.ambient*.13+illumination*.12);
  for(const [x,y,w,h] of patterns[zone.id]){
    traceSurface(ctx,[[zone.minX+x,zone.minY+y,.006],[zone.minX+x+w,zone.minY+y,.006],
      [zone.minX+x+w,zone.minY+y+h,.006],[zone.minX+x,zone.minY+y+h,.006]],camera);
    ctx.fillStyle=zone.accent;ctx.fill();
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
  const common=[player,flashlight,camera,viewport] as const;
  for(const zone of ZONES){
    const shade=.5*(1-zone.ambient),strength=.78+shade*.4;
    drawSurface(ctx,[[zone.minX,zone.minY,0],[zone.maxX,zone.minY,0],
      [zone.maxX,zone.maxY,0],[zone.minX,zone.maxY,0]],zone.floor,[174,166,127],strength,shade,...common);
    if(zone.minY===0)drawSurface(ctx,[[zone.minX,0,0],[zone.maxX,0,0],
      [zone.maxX,0,ROOM_STYLE.wallHeight],[zone.minX,0,ROOM_STYLE.wallHeight]],
      zone.wall,[184,176,137],strength*.82,shade,...common);
    if(zone.minX===0)drawSurface(ctx,[[0,zone.minY,0],[0,zone.maxY,0],
      [0,zone.maxY,ROOM_STYLE.wallHeight],[0,zone.minY,ROOM_STYLE.wallHeight]],
      zone.wall,[165,159,128],strength*.72,shade,...common);
  }
  for(const zone of ZONES)drawCharacteristics(ctx,zone,player,flashlight,camera,room);
  for(const wall of WALLS){
    const midpoint=(wall.from+wall.to)/2;
    const adjacent=wall.axis==="x"?zoneAt(wall.position-.05,midpoint):zoneAt(midpoint,wall.position-.05);
    const wallColor=adjacent?.wall??ROOM_STYLE.backWall,shade=.5*(1-(adjacent?.ambient??.05));
    const points:SurfacePoint[]=wall.axis==="x"
      ?[[wall.position,wall.from,0],[wall.position,wall.to,0],[wall.position,wall.to,ROOM_STYLE.wallHeight],[wall.position,wall.from,ROOM_STYLE.wallHeight]]
      :[[wall.from,wall.position,0],[wall.to,wall.position,0],[wall.to,wall.position,ROOM_STYLE.wallHeight],[wall.from,wall.position,ROOM_STYLE.wallHeight]];
    drawSurface(ctx,points,wallColor,[180,171,135],.78,shade,...common);
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
