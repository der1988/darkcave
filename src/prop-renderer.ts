import { project, type Camera, type Point } from "./geometry";
import type { Flashlight } from "./flashlight";
import { ROOM_PROPS, type RoomProp } from "./room-props";
import type { ActorState } from "./native";

type Room = { width: number; height: number };
const lit = (color: RoomProp["color"], amount: number) =>
  `rgb(${color.map((channel) => Math.round(channel * Math.max(.28, Math.min(1.65, amount)))).join(",")})`;

function polygon(ctx: CanvasRenderingContext2D, points: [number, number, number][], camera: Camera, fill: string | CanvasGradient) {
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

export function objectShadow(p: RoomProp, origin: Point, softness = 0) {
  const cx = (p.minX + p.maxX) / 2, cy = (p.minY + p.maxY) / 2;
  const dx = cx - origin.x, dy = cy - origin.y, distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance, uy = dy / distance;
  const px = -uy, py = ux;
  const halfWidth = (Math.abs(px) * (p.maxX-p.minX) + Math.abs(py) * (p.maxY-p.minY)) * .5;
  const spread = halfWidth + softness;
  const length = Math.min(2.4, Math.max(.24, p.height * (.82 + 1.8 / (distance + .35))));
  return [
    [cx-px*spread,cy-py*spread,.003], [cx+px*spread,cy+py*spread,.003],
    [cx+ux*length+px*(spread+softness),cy+uy*length+py*(spread+softness),.003],
    [cx+ux*length-px*(spread+softness),cy+uy*length-py*(spread+softness),.003],
  ] as [number, number, number][];
}

function shadowCasters(p: RoomProp): RoomProp[] {
  const part = (minX: number, minY: number, maxX: number, maxY: number, height: number) =>
    ({...p,minX,minY,maxX,maxY,height});
  const w=p.maxX-p.minX,d=p.maxY-p.minY;
  if (p.kind === "lamp") return [
    part(p.minX,p.minY,p.maxX,p.maxY,.06),
    part(p.minX+w*.43,p.minY+d*.43,p.minX+w*.57,p.minY+d*.57,p.height),
    part(p.minX-.05,p.minY-.05,p.maxX+.05,p.maxY+.05,p.height),
  ];
  if (p.kind === "table") return [
    part(p.minX+.04,p.minY+.04,p.maxX-.04,p.maxY-.04,p.height),
    ...[[.09,.1],[.82,.1],[.09,.78],[.82,.78]].map(([x,y]) =>
      part(p.minX+w*x-.035,p.minY+d*y-.035,p.minX+w*x+.035,p.minY+d*y+.035,p.height)),
  ];
  if (p.kind === "chair" || p.kind === "armchair") {
    const inset=p.kind === "armchair"?.04:.09;
    const parts=[
      part(p.minX+inset,p.minY+inset,p.maxX-inset,p.maxY-inset,p.kind === "armchair"?.38:.35),
      part(p.minX+inset,p.maxY-.16,p.maxX-inset,p.maxY,p.height),
    ];
    if (p.kind === "armchair") parts.push(
      part(p.minX,p.minY+.06,p.minX+.17,p.maxY-.08,.55),
      part(p.maxX-.17,p.minY+.06,p.maxX,p.maxY-.08,.55),
    );
    return parts;
  }
  return [p];
}

function drawShadow(ctx: CanvasRenderingContext2D, p: RoomProp, origin: Point, camera: Camera, amount: number) {
  if (amount < .025) return;
  ctx.save();
  ctx.globalCompositeOperation="multiply";
  for (const caster of shadowCasters(p)) {
    const center={x:(caster.minX+caster.maxX)/2,y:(caster.minY+caster.maxY)/2};
    const base=project(center.x,center.y,.003);
    const hardShape=objectShadow(caster,origin);
    const tip=project(hardShape[2][0],hardShape[2][1],.003);
    for (const [softness,opacity] of [[.075,.1],[.035,.18],[0,.3]] as const) {
      const shadow=ctx.createLinearGradient(base.x+camera.x,base.y+camera.y,tip.x+camera.x,tip.y+camera.y);
      shadow.addColorStop(0,`rgba(8,9,10,${Math.min(.72,amount*opacity*2.15)})`);
      shadow.addColorStop(.18,`rgba(8,9,10,${Math.min(.58,amount*opacity*1.7)})`);
      shadow.addColorStop(.78,`rgba(8,9,10,${Math.min(.3,amount*opacity)})`);
      shadow.addColorStop(1,"rgba(8,9,10,0)");
      polygon(ctx,objectShadow(caster,origin,softness),camera,shadow);
    }
    const contact=Math.max(.025,Math.min(.12,(caster.maxX-caster.minX)*.14));
    polygon(ctx,objectShadow({...caster,height:contact},origin),camera,
      `rgba(3,4,5,${Math.min(.68,amount*.42)})`);
  }
  ctx.restore();
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
    const samples = [
      [(p.minX+p.maxX)/2,(p.minY+p.maxY)/2],
      [p.minX,p.minY],[p.maxX,p.minY],[p.minX,p.maxY],[p.maxX,p.maxY],
      [(p.minX+p.maxX)/2,p.minY],[(p.minX+p.maxX)/2,p.maxY],
      [p.minX,(p.minY+p.maxY)/2],[p.maxX,(p.minY+p.maxY)/2],
    ];
    const illumination = Math.max(...samples.map(([x,y]) => flashlight.at({x,y}, origin, room, p)));
    drawShadow(ctx,p,origin,camera,illumination);
    drawProp(ctx,p,camera,.34+illumination*.72);
  }
}

export function drawWallPicture(ctx: CanvasRenderingContext2D, camera: Camera, player: ActorState, flashlight: Flashlight, room: Room) {
  const center={x:5.35,y:0}; const origin=flashlight.origin(player);
  const light=flashlight.at(center,origin,room);
  if (light > .025) {
    const shift = Math.max(-.09,Math.min(.09,(center.x-origin.x)*.025));
    polygon(ctx,[[4.92+shift,.003,.65],[5.72+shift,.003,.69],[5.72+shift,.003,1.13],[4.92+shift,.003,1.08]],camera,`rgba(0,0,0,${Math.min(.48,light*.3)})`);
  }
  polygon(ctx,[[4.92,.002,.61],[5.72,.002,.65],[5.72,.002,1.08],[4.92,.002,1.03]],camera,lit([52,44,38],.4+light*.7));
  polygon(ctx,[[5.01,.001,.68],[5.63,.001,.71],[5.63,.001,.99],[5.01,.001,.96]],camera,lit([87,79,64],.35+light*.8));
}
