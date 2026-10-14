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
  const length=Math.min(.55,Math.max(.14,physical));
  return [[left[0],left[1],.003],[right[0],right[1],.003],
    [right[0]+ux*length,right[1]+uy*length,.003],
    [left[0]+ux*length,left[1]+uy*length,.003]];
}
function expanded(points:Vertex[],amount:number):Vertex[]{
  const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;
  return points.map(([x,y,z])=>{const d=Math.hypot(x-cx,y-cy)||1;return [x+(x-cx)/d*amount,y+(y-cy)/d*amount,z];});
}
function drawShadow(ctx:CanvasRenderingContext2D,cube:RoomProp,origin:Point,camera:Camera,amount:number){
  const shape=objectShadow(cube,origin),strength=Math.min(.22,amount*.16);
  ctx.save();
  if(amount>.025){
    polygon(ctx,expanded(shape,.055),camera,`rgba(0,0,0,${strength*.12})`);
    polygon(ctx,expanded(shape,.025),camera,`rgba(0,0,0,${strength*.22})`);
    polygon(ctx,shape,camera,`rgba(0,0,0,${strength*.36})`);
  }
  const footprint:Vertex[]=[[cube.minX,cube.minY,.004],[cube.maxX,cube.minY,.004],
    [cube.maxX,cube.maxY,.004],[cube.minX,cube.maxY,.004]];
  polygon(ctx,expanded(footprint,.018),camera,"rgba(0,0,0,.045)");
  polygon(ctx,footprint,camera,`rgba(0,0,0,${.12+amount*.06})`);ctx.restore();
}
function drawCube(ctx:CanvasRenderingContext2D,c:RoomProp,camera:Camera,amount:number){
  const {minX:x0,minY:y0,maxX:x1,maxY:y1,height:z}=c;
  const brightness=.72+amount*.42;
  const faces:{points:Vertex[];shade:number}[]=[
    {points:[[x1,y0,0],[x1,y1,0],[x1,y1,z],[x1,y0,z]],shade:brightness*.9},
    {points:[[x0,y1,0],[x1,y1,0],[x1,y1,z],[x0,y1,z]],shade:brightness*.82},
    {points:[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],shade:brightness},
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
    drawShadow(ctx,cube,origin,camera,light);drawCube(ctx,cube,camera,light);}
}
