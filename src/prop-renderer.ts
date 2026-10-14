import { LIGHT } from "./config";
import type { Flashlight } from "./flashlight";
import type { ActorState } from "./game";
import { project, type Camera, type Point } from "./geometry";
import { ROOM_PROPS, type RoomProp } from "./room-props";

type Room={width:number;height:number};
type Vertex=[number,number,number];
const lit=(color:RoomProp["color"],amount:number)=>`rgb(${color.map(v=>Math.round(v*Math.max(.28,Math.min(1.65,amount)))).join(",")})`;
function polygon(ctx:CanvasRenderingContext2D,points:Vertex[],camera:Camera,fill:string|CanvasGradient){
  ctx.beginPath();points.forEach(([x,y,z],i)=>{const p=project(x,y,z);if(i)ctx.lineTo(p.x+camera.x,p.y+camera.y);else ctx.moveTo(p.x+camera.x,p.y+camera.y);});
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
}
function convexHull(points:Point[]){
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
  const cross=(o:Point,a:Point,b:Point)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
  const build=(values:Point[])=>{const result:Point[]=[];for(const p of values){while(result.length>1&&cross(result.at(-2)!,result.at(-1)!,p)<=0)result.pop();result.push(p);}return result;};
  return build(sorted).slice(0,-1).concat(build([...sorted].reverse()).slice(0,-1));
}

// Exact perspective projection of the cube from the lens onto the floor.
export function objectShadow(cube:RoomProp,origin:Point):Vertex[]{
  const floor=[{x:cube.minX,y:cube.minY},{x:cube.maxX,y:cube.minY},{x:cube.maxX,y:cube.maxY},{x:cube.minX,y:cube.maxY}];
  const scale=LIGHT.lensHeight/(LIGHT.lensHeight-cube.height);
  const top=floor.map(p=>({x:origin.x+(p.x-origin.x)*scale,y:origin.y+(p.y-origin.y)*scale}));
  return convexHull([...floor,...top]).map(p=>[p.x,p.y,.003]);
}
function expanded(points:Vertex[],amount:number):Vertex[]{
  const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;
  return points.map(([x,y,z])=>{const d=Math.hypot(x-cx,y-cy)||1;return [x+(x-cx)/d*amount,y+(y-cy)/d*amount,z];});
}
function drawShadow(ctx:CanvasRenderingContext2D,cube:RoomProp,origin:Point,camera:Camera,amount:number){
  if(amount<.025)return;const shape=objectShadow(cube,origin),center={x:(cube.minX+cube.maxX)/2,y:(cube.minY+cube.maxY)/2};
  const far=shape.reduce((best,p)=>Math.hypot(p[0]-origin.x,p[1]-origin.y)>Math.hypot(best[0]-origin.x,best[1]-origin.y)?p:best);
  const base=project(center.x,center.y,.003),tip=project(far[0],far[1],.003);ctx.save();ctx.globalCompositeOperation="multiply";
  for(const [softness,opacity] of [[.045,.12],[.02,.2],[0,.38]] as const){const g=ctx.createLinearGradient(base.x+camera.x,base.y+camera.y,tip.x+camera.x,tip.y+camera.y);
    g.addColorStop(0,`rgba(4,5,6,${Math.min(.78,amount*opacity*2)})`);g.addColorStop(.72,`rgba(4,5,6,${Math.min(.5,amount*opacity)})`);g.addColorStop(1,"rgba(4,5,6,0)");polygon(ctx,expanded(shape,softness),camera,g);}
  polygon(ctx,[[cube.minX,cube.minY,.004],[cube.maxX,cube.minY,.004],[cube.maxX,cube.maxY,.004],[cube.minX,cube.maxY,.004]],camera,`rgba(2,3,4,${Math.min(.72,amount*.48)})`);ctx.restore();
}
function drawCube(ctx:CanvasRenderingContext2D,c:RoomProp,camera:Camera,light:number){
  const {minX:x0,minY:y0,maxX:x1,maxY:y1,height:z}=c;
  const faces:{points:Vertex[];shade:number}[]=[
    {points:[[x0,y0,0],[x1,y0,0],[x1,y0,z],[x0,y0,z]],shade:.72},
    {points:[[x0,y0,0],[x0,y1,0],[x0,y1,z],[x0,y0,z]],shade:.58},
    {points:[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],shade:1},
  ];
  for(const face of faces){
    polygon(ctx,face.points,camera,lit(c.color,light*face.shade));
    ctx.beginPath();face.points.forEach(([x,y,height],index)=>{const point=project(x,y,height);
      if(index)ctx.lineTo(point.x+camera.x,point.y+camera.y);else ctx.moveTo(point.x+camera.x,point.y+camera.y);});
    ctx.closePath();ctx.strokeStyle=`rgba(173,158,125,${Math.min(.24,.06+light*.1)})`;ctx.lineWidth=.65;ctx.stroke();
  }
}
export function drawProps(ctx:CanvasRenderingContext2D,player:ActorState,flashlight:Flashlight,camera:Camera,room:Room,beforeDepth:number|null){
  const origin=flashlight.origin(player);for(const cube of ROOM_PROPS){const depth=(cube.minX+cube.maxX+cube.minY+cube.maxY)/2;
    if(beforeDepth===null?depth<=player.x+player.y:depth>beforeDepth)continue;
    const samples=[[cube.minX,cube.minY],[cube.maxX,cube.minY],[cube.maxX,cube.maxY],[cube.minX,cube.maxY],[(cube.minX+cube.maxX)/2,(cube.minY+cube.maxY)/2]];
    const light=Math.max(...samples.map(([x,y])=>flashlight.at({x,y},origin,room,cube)));drawShadow(ctx,cube,origin,camera,light);drawCube(ctx,cube,camera,.34+light*.72);}
}
