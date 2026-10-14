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
// The cast volume begins on the two exact silhouette corners and extends away from the lens.
export function objectShadow(cube:RoomProp,origin:Point):Vertex[]{
  const cx=(cube.minX+cube.maxX)/2,cy=(cube.minY+cube.maxY)/2;
  const dx=cx-origin.x,dy=cy-origin.y,distance=Math.hypot(dx,dy)||1;
  const ux=dx/distance,uy=dy/distance,px=-uy,py=ux;
  const corners=[[cube.minX,cube.minY],[cube.maxX,cube.minY],[cube.maxX,cube.maxY],[cube.minX,cube.maxY]];
  const ordered=[...corners].sort((a,b)=>(a[0]*px+a[1]*py)-(b[0]*px+b[1]*py));
  const left=ordered[0],right=ordered.at(-1)!;
  const physical=distance*cube.height/Math.max(.08,LIGHT.lensHeight-cube.height);
  const length=Math.min(.9,Math.max(.22,physical));
  return [[left[0],left[1],.003],[right[0],right[1],.003],
    [right[0]+ux*length,right[1]+uy*length,.003],
    [left[0]+ux*length,left[1]+uy*length,.003]];
}
function expanded(points:Vertex[],amount:number):Vertex[]{
  const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;
  return points.map(([x,y,z])=>{const d=Math.hypot(x-cx,y-cy)||1;return [x+(x-cx)/d*amount,y+(y-cy)/d*amount,z];});
}
function drawShadow(ctx:CanvasRenderingContext2D,cube:RoomProp,origin:Point,camera:Camera,amount:number){
  const shape=objectShadow(cube,origin),strength=Math.min(.58,amount*.34);
  ctx.save();ctx.globalCompositeOperation="multiply";
  if(amount>.025){
    polygon(ctx,expanded(shape,.035),camera,`rgba(4,5,6,${strength*.12})`);
    polygon(ctx,expanded(shape,.015),camera,`rgba(4,5,6,${strength*.24})`);
    polygon(ctx,shape,camera,`rgba(2,3,4,${strength*.62})`);
  }
  const footprint:Vertex[]=[[cube.minX,cube.minY,.004],[cube.maxX,cube.minY,.004],
    [cube.maxX,cube.maxY,.004],[cube.minX,cube.maxY,.004]];
  polygon(ctx,expanded(footprint,.025),camera,"rgba(2,3,4,.1)");
  polygon(ctx,footprint,camera,`rgba(2,3,4,${.3+amount*.16})`);ctx.restore();
}
function drawCube(ctx:CanvasRenderingContext2D,c:RoomProp,camera:Camera,amount:number,origin:Point){
  const {minX:x0,minY:y0,maxX:x1,maxY:y1,height:z}=c;
  const cx=(x0+x1)/2,cy=(y0+y1)/2,distance=Math.hypot(origin.x-cx,origin.y-cy)||1;
  const lx=(origin.x-cx)/distance,ly=(origin.y-cy)/distance;
  const sideLight=(nx:number,ny:number)=>.64+amount*(.16+Math.max(0,nx*lx+ny*ly)*.46);
  const faces:{points:Vertex[];shade:number}[]=[
    {points:[[x0,y0,0],[x1,y0,0],[x1,y0,z],[x0,y0,z]],shade:sideLight(0,-1)},
    {points:[[x0,y0,0],[x0,y1,0],[x0,y1,z],[x0,y0,z]],shade:sideLight(-1,0)},
    {points:[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],shade:.8+amount*.3},
  ];
  for(const face of faces){
    polygon(ctx,face.points,camera,lit(c.color,face.shade));
    ctx.beginPath();face.points.forEach(([x,y,height],index)=>{const point=project(x,y,height);
      if(index)ctx.lineTo(point.x+camera.x,point.y+camera.y);else ctx.moveTo(point.x+camera.x,point.y+camera.y);});
    ctx.closePath();ctx.strokeStyle=`rgba(184,169,137,${Math.min(.28,.1+amount*.12)})`;ctx.lineWidth=.7;ctx.stroke();
  }
}
export function drawProps(ctx:CanvasRenderingContext2D,player:ActorState,flashlight:Flashlight,camera:Camera,room:Room,beforeDepth:number|null){
  const origin=flashlight.origin(player);for(const cube of ROOM_PROPS){const depth=(cube.minX+cube.maxX+cube.minY+cube.maxY)/2;
    if(beforeDepth===null?depth<=player.x+player.y:depth>beforeDepth)continue;
    const samples=[[cube.minX,cube.minY],[cube.maxX,cube.minY],[cube.maxX,cube.maxY],[cube.minX,cube.maxY],[(cube.minX+cube.maxX)/2,(cube.minY+cube.maxY)/2]];
    const light=Math.max(...samples.map(([x,y])=>flashlight.at({x,y},origin,room,cube)));
    drawShadow(ctx,cube,origin,camera,light);drawCube(ctx,cube,camera,light,origin);}
}
