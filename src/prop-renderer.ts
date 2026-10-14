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
// The contact shadow is the cube footprint: it cannot detach from the object.
export function objectShadow(cube:RoomProp,_origin:Point):Vertex[]{
  return [[cube.minX,cube.minY,.003],[cube.maxX,cube.minY,.003],
    [cube.maxX,cube.maxY,.003],[cube.minX,cube.maxY,.003]];
}
function expanded(points:Vertex[],amount:number):Vertex[]{
  const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;
  return points.map(([x,y,z])=>{const d=Math.hypot(x-cx,y-cy)||1;return [x+(x-cx)/d*amount,y+(y-cy)/d*amount,z];});
}
function drawShadow(ctx:CanvasRenderingContext2D,cube:RoomProp,origin:Point,camera:Camera,amount:number){
  const shape=objectShadow(cube,origin),strength=.24+Math.min(.34,amount*.22);
  ctx.save();ctx.globalCompositeOperation="multiply";
  polygon(ctx,expanded(shape,.045),camera,`rgba(4,5,6,${strength*.16})`);
  polygon(ctx,expanded(shape,.018),camera,`rgba(4,5,6,${strength*.3})`);
  polygon(ctx,shape,camera,`rgba(2,3,4,${strength})`);ctx.restore();
}
function drawCube(ctx:CanvasRenderingContext2D,c:RoomProp,camera:Camera,light:number){
  const {minX:x0,minY:y0,maxX:x1,maxY:y1,height:z}=c;
  const faces:{points:Vertex[];shade:number}[]=[
    {points:[[x0,y0,0],[x1,y0,0],[x1,y0,z],[x0,y0,z]],shade:.88},
    {points:[[x0,y0,0],[x0,y1,0],[x0,y1,z],[x0,y0,z]],shade:.72},
    {points:[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],shade:1.05},
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
    const light=Math.max(...samples.map(([x,y])=>flashlight.at({x,y},origin,room,cube)));drawShadow(ctx,cube,origin,camera,light);drawCube(ctx,cube,camera,.5+light*.58);}
}
