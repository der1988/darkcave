import { ROOM } from "./room";

export type ActorState={x:number;y:number;heading:number;stride:number;moving:boolean;stealth:boolean};
export type Game={room:{width:number;height:number};update(dt:number,horizontal:number,vertical:number,stealth:boolean):void;player():ActorState;brother():ActorState};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function createGame():Game{
  const player:ActorState={x:3.15,y:2.35,heading:-Math.PI/4,stride:0,moving:false,stealth:false};
  const brother:ActorState={x:2.72,y:2.58,heading:-Math.PI/4,stride:0,moving:false,stealth:false};
  return{room:ROOM,update(dt,horizontal,vertical,stealth){
    dt=clamp(dt,0,.04);const dx=horizontal+vertical,dy=-horizontal+vertical,length=Math.hypot(dx,dy);player.moving=false;player.stealth=stealth;
    if(length>.001){const ux=dx/length,uy=dy/length,speed=stealth?1.15:2.05,distance=speed*dt;
      player.x=clamp(player.x+ux*distance,.22,ROOM.width-.22);player.y=clamp(player.y+uy*distance,.22,ROOM.height-.22);
      player.heading=Math.atan2(uy,ux);player.stride+=distance*8;player.moving=true;}
    const fx=player.x-brother.x,fy=player.y-brother.y,gap=Math.hypot(fx,fy);brother.moving=false;brother.stealth=stealth;
    if(gap>.5){const step=Math.min(gap-.5,(stealth?1.25:2.3)*dt);brother.x=clamp(brother.x+fx/gap*step,.22,ROOM.width-.22);brother.y=clamp(brother.y+fy/gap*step,.22,ROOM.height-.22);
      brother.heading=Math.atan2(fy,fx);brother.stride+=step*8;brother.moving=true;}
  },player:()=>({...player}),brother:()=>({...brother})};
}
