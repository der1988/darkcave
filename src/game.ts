import { ROOM_PROPS } from "./room-props";
import { WALLS,WORLD } from "./world";

export type ActorState = { x:number; y:number; heading:number; stride:number; moving:boolean; stealth:boolean };
export type Game = {
  room:{width:number;height:number};
  update(dt:number,horizontal:number,vertical:number,stealth:boolean):void;
  player():ActorState; brother():ActorState;
};
const ROOM=WORLD;
const margin=.24,radius=.17;
const clamp=(v:number,low:number,high:number)=>Math.max(low,Math.min(high,v));
const blocked=(x:number,y:number)=>{
  for(const cube of ROOM_PROPS)if(x>cube.minX-radius&&x<cube.maxX+radius&&y>cube.minY-radius&&y<cube.maxY+radius)return true;
  for(const wall of WALLS){
    const across=wall.axis==="x"?x:y,along=wall.axis==="x"?y:x;
    if(Math.abs(across-wall.position)<radius+.035&&along>wall.from-radius&&along<wall.to+radius)return true;
  }
  return false;
};
function move(actor:ActorState,dx:number,dy:number) {
  const x=clamp(actor.x+dx,margin,ROOM.width-margin); if(!blocked(x,actor.y)) actor.x=x;
  const y=clamp(actor.y+dy,margin,ROOM.height-margin); if(!blocked(actor.x,y)) actor.y=y;
}
export function createGame():Game {
  const player:ActorState={x:2.2,y:1.55,heading:-.78,stride:0,moving:false,stealth:false};
  const brother:ActorState={x:1.76,y:1.82,heading:-.78,stride:0,moving:false,stealth:false};
  return {room:ROOM,update(dt,horizontal,vertical,stealth) {
    dt=clamp(dt,0,.04); const wx=horizontal+vertical,wy=-horizontal+vertical,m=Math.hypot(wx,wy);
    player.moving=false;player.stealth=stealth;
    if(m>.001){const dx=wx/m,dy=wy/m,speed=stealth?1.15:2.1,oldX=player.x,oldY=player.y;
      move(player,dx*speed*dt,dy*speed*dt); const travelled=Math.hypot(player.x-oldX,player.y-oldY);
      if(travelled>0){player.heading=Math.atan2(dy,dx);player.stride+=travelled*8;player.moving=true;}}
    const fx=player.x-brother.x,fy=player.y-brother.y,distance=Math.hypot(fx,fy); brother.moving=false;brother.stealth=stealth;
    if(distance>.5){const step=Math.min(distance-.5,(stealth?1.25:2.35)*dt);move(brother,fx/distance*step,fy/distance*step);
      brother.heading=Math.atan2(fy,fx);brother.stride+=step*8;brother.moving=true;}
  },player:()=>({...player}),brother:()=>({...brother})};
}
