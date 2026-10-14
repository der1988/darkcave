import { project, type Camera, type Point } from "./geometry";
import type { Flashlight } from "./flashlight";
import { ROOM_PROPS, type RoomProp } from "./room-props";
import type { ActorState } from "./native";

type Room = { width: number; height: number };
const lit = (color: RoomProp["color"], amount: number) =>
  `rgb(${color.map((channel) => Math.round(channel * Math.max(.28, Math.min(1.65, amount)))).join(",")})`;

function polygon(ctx: CanvasRenderingContext2D, points: [number, number, number][], camera: Camera, fill: string) {
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const p = project(x, y, z);
    if (index) ctx.lineTo(p.x + camera.x, p.y + camera.y);
    else ctx.moveTo(p.x + camera.x, p.y + camera.y);
  });
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

function cuboid(ctx: CanvasRenderingContext2D, p: RoomProp, camera: Camera, light: number, inset = 0) {
  const x0 = p.minX + inset, y0 = p.minY + inset;
  const x1 = p.maxX - inset, y1 = p.maxY - inset, z = p.height;
  polygon(ctx, [[x0,y0,0],[x1,y0,0],[x1,y0,z],[x0,y0,z]], camera, lit(p.color, light * .7));
  polygon(ctx, [[x0,y0,0],[x0,y1,0],[x0,y1,z],[x0,y0,z]], camera, lit(p.color, light * .58));
  polygon(ctx, [[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]], camera, lit(p.color, light));
}

function drawShadow(ctx: CanvasRenderingContext2D, p: RoomProp, origin: Point, camera: Camera, amount: number) {
  if (amount < .1) return;
  const cx = (p.minX + p.maxX) / 2, cy = (p.minY + p.maxY) / 2;
  const dx = cx - origin.x, dy = cy - origin.y, length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length, spread = Math.max(p.maxX-p.minX,p.maxY-p.minY) * .55;
  polygon(ctx, [[cx-spread*uy,cy+spread*ux,.003],[cx+spread*uy,cy-spread*ux,.003],
    [cx+ux*(p.height*1.25)+spread*uy,cy+uy*(p.height*1.25)-spread*ux,.003],
    [cx+ux*(p.height*1.65)-spread*uy,cy+uy*(p.height*1.65)+spread*ux,.003]], camera,
    `rgba(0,0,0,${Math.min(.55, amount*.28)})`);
}

function drawProp(ctx: CanvasRenderingContext2D, p: RoomProp, camera: Camera, light: number) {
  if (p.kind === "lamp") {
    cuboid(ctx, {...p, height:.06}, camera, light);
    const c = project((p.minX+p.maxX)/2,(p.minY+p.maxY)/2,p.height);
    const b = project((p.minX+p.maxX)/2,(p.minY+p.maxY)/2,.05);
    ctx.strokeStyle = lit(p.color, light*.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x+camera.x,b.y+camera.y); ctx.lineTo(c.x+camera.x,c.y+camera.y); ctx.stroke();
    ctx.fillStyle = lit([91,82,62], light); ctx.fillRect(c.x+camera.x-4,c.y+camera.y-2,8,4); return;
  }
  if (p.kind === "table") {
    cuboid(ctx, p, camera, light, .05);
    for (const [dx,dy] of [[.2,.18],[.48,.25],[.7,.16]]) {
      const q = project(p.minX+dx,p.minY+dy,p.height+.025);
      ctx.fillStyle = lit([104,91,68],light*1.1); ctx.fillRect(q.x+camera.x-1,q.y+camera.y-1,3,2);
    }
    return;
  }
  if (p.kind === "chair" || p.kind === "armchair") {
    const seat = {...p, height:p.kind === "armchair" ? .38 : .35}; cuboid(ctx, seat, camera, light, .04);
    cuboid(ctx, {...p, minY:p.maxY-.17}, camera, light*.9);
    if (p.kind === "armchair") {
      cuboid(ctx, {...p, maxX:p.minX+.17, height:.55}, camera, light*.85);
      cuboid(ctx, {...p, minX:p.maxX-.17, height:.55}, camera, light*.85);
    }
    return;
  }
  cuboid(ctx, p, camera, light, p.kind === "cabinet" ? .025 : 0);
  if (p.kind === "cabinet") {
    const knob = project(p.maxX-.12,p.minY-.006,p.height*.54);
    ctx.fillStyle = lit([115,105,78],light); ctx.fillRect(knob.x+camera.x,knob.y+camera.y,1,1);
  }
}

export function drawProps(ctx: CanvasRenderingContext2D, player: ActorState, flashlight: Flashlight,
  camera: Camera, room: Room, beforeDepth: number | null) {
  const origin = flashlight.origin(player);
  for (const p of ROOM_PROPS) {
    const depth = (p.minX+p.maxX+p.minY+p.maxY)/2;
    if (beforeDepth === null ? depth <= player.x+player.y : depth > beforeDepth) continue;
    const center = {x:(p.minX+p.maxX)/2,y:(p.minY+p.maxY)/2};
    const illumination = flashlight.at(center, origin, room, p);
    drawShadow(ctx,p,origin,camera,illumination);
    drawProp(ctx,p,camera,.34+illumination*.72);
  }
}

export function drawWallPicture(ctx: CanvasRenderingContext2D, camera: Camera, player: ActorState, flashlight: Flashlight, room: Room) {
  const center={x:5.35,y:0}; const light=flashlight.at(center,flashlight.origin(player),room);
  polygon(ctx,[[4.92,.002,.61],[5.72,.002,.65],[5.72,.002,1.08],[4.92,.002,1.03]],camera,lit([52,44,38],.4+light*.7));
  polygon(ctx,[[5.01,.001,.68],[5.63,.001,.71],[5.63,.001,.99],[5.01,.001,.96]],camera,lit([87,79,64],.35+light*.8));
}
