import { ROOM_PROPS } from "./room-props";
import { DOOR_MAX,DOOR_MIN,WORLD } from "./world";

export type ActorState = { x:number; y:number; heading:number; stride:number; moving:boolean };
export type Game = {
  room:{width:number;height:number};
  update(dt:number,horizontal:number,vertical:number,running:boolean):void;
  player():ActorState; brother():ActorState;
};
const ROOM=WORLD;
const margin=.24,radius=.17;
const clamp=(v:number,low:number,high:number)=>Math.max(low,Math.min(high,v));
const blocked=(x:number,y:number)=>{
  for(const cube of ROOM_PROPS)if(x>cube.minX-radius&&x<cube.maxX+radius&&y>cube.minY-radius&&y<cube.maxY+radius)return true;
  for(const wallX of [4,8])if(Math.abs(x-wallX)<radius+.035&&(y<DOOR_MIN+radius||y>DOOR_MAX-radius))return true;
  return false;
};
function move(actor:ActorState,dx:number,dy:number) {
  const x=clamp(actor.x+dx,margin,ROOM.width-margin); if(!blocked(x,actor.y)) actor.x=x;
  const y=clamp(actor.y+dy,margin,ROOM.height-margin); if(!blocked(actor.x,y)) actor.y=y;
}
export function createGame():Game {
  const player:ActorState={x:2.2,y:1.55,heading:-.78,stride:0,moving:false};
  const brother:ActorState={x:1.76,y:1.82,heading:-.78,stride:0,moving:false};
  return {room:ROOM,update(dt,horizontal,vertical,running) {
    dt=clamp(dt,0,.04); const wx=horizontal+vertical,wy=-horizontal+vertical,m=Math.hypot(wx,wy);
    player.moving=false;
    if(m>.001){const dx=wx/m,dy=wy/m,speed=running?3:2.1,oldX=player.x,oldY=player.y;
      move(player,dx*speed*dt,dy*speed*dt); const travelled=Math.hypot(player.x-oldX,player.y-oldY);
      if(travelled>0){player.heading=Math.atan2(dy,dx);player.stride+=travelled*8;player.moving=true;}}
    const fx=player.x-brother.x,fy=player.y-brother.y,distance=Math.hypot(fx,fy); brother.moving=false;
    if(distance>.5){const step=Math.min(distance-.5,(running?3.2:2.35)*dt);move(brother,fx/distance*step,fy/distance*step);
      brother.heading=Math.atan2(fy,fx);brother.stride+=step*8;brother.moving=true;}
  },player:()=>({...player}),brother:()=>({...brother})};
}
