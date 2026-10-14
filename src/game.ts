import { ROOM,WALLS } from "./room";

export type ActorState={x:number;y:number;heading:number;stride:number;moving:boolean;stealth:boolean};
export type Game={room:{width:number;height:number};update(dt:number,horizontal:number,vertical:number,stealth:boolean):void;player():ActorState;brother():ActorState};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const radius=.18;
const blocked=(x:number,y:number)=>WALLS.some(wall=>{const across=wall.axis==="x"?x:y,along=wall.axis==="x"?y:x;return Math.abs(across-wall.position)<radius+.025&&along>wall.from-radius&&along<wall.to+radius;});
const move=(actor:ActorState,dx:number,dy:number)=>{const x=clamp(actor.x+dx,.22,ROOM.width-.22);if(!blocked(x,actor.y))actor.x=x;const y=clamp(actor.y+dy,.22,ROOM.height-.22);if(!blocked(actor.x,y))actor.y=y;};

export function createGame():Game{
  const player:ActorState={x:1.9,y:1.55,heading:-Math.PI/4,stride:0,moving:false,stealth:false};
  const brother:ActorState={x:1.48,y:1.78,heading:-Math.PI/4,stride:0,moving:false,stealth:false};
  return{room:ROOM,update(dt,horizontal,vertical,stealth){
    dt=clamp(dt,0,.04);const dx=horizontal+vertical,dy=-horizontal+vertical,length=Math.hypot(dx,dy);player.moving=false;player.stealth=stealth;
    if(length>.001){const ux=dx/length,uy=dy/length,speed=stealth?1.15:2.05,distance=speed*dt;
      move(player,ux*distance,uy*distance);
      player.heading=Math.atan2(uy,ux);player.stride+=distance*8;player.moving=true;}
    const fx=player.x-brother.x,fy=player.y-brother.y,gap=Math.hypot(fx,fy);brother.moving=false;brother.stealth=stealth;
    if(gap>.5){const step=Math.min(gap-.5,(stealth?1.25:2.3)*dt);move(brother,fx/gap*step,fy/gap*step);
      brother.heading=Math.atan2(fy,fx);brother.stride+=step*8;brother.moving=true;}
  },player:()=>({...player}),brother:()=>({...brother})};
}
