import { HOUSE,LADDERS,PLATFORMS } from "./house-world";
export type ActorState={x:number;y:number;heading:number;stride:number;moving:boolean;stealth:boolean;grounded?:boolean};
type InternalActor=ActorState&{velocityY:number;grounded:boolean};
export type Game={room:{width:number;height:number};update(dt:number,horizontal:number,vertical:number,stealth:boolean):void;player():ActorState;brother():ActorState};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const snapshot=({velocityY:_,...actor}:InternalActor):ActorState=>({...actor});
const ladderFor=(actor:InternalActor)=>LADDERS.find(l=>Math.abs(actor.x-l.x)<.34&&actor.y>=l.fromY-.12&&actor.y<=l.toY+.12);
function simulate(actor:InternalActor,dt:number,horizontal:number,vertical:number,stealth:boolean){
  const speed=stealth?1.25:2.25;actor.stealth=stealth;actor.moving=Math.abs(horizontal)>.01;
  actor.x=clamp(actor.x+horizontal*speed*dt,.18,HOUSE.width-.18);
  if(horizontal){actor.heading=horizontal>0?0:Math.PI;actor.stride+=Math.abs(horizontal*speed*dt)*8;}
  const ladder=ladderFor(actor);
  if(ladder&&Math.abs(vertical)>.01){actor.x+=(ladder.x-actor.x)*Math.min(1,dt*10);actor.y=clamp(actor.y-vertical*1.55*dt,ladder.fromY,ladder.toY);actor.velocityY=0;actor.grounded=false;actor.moving=true;return;}
  if(vertical<-.2&&actor.grounded){actor.velocityY=3.45;actor.grounded=false;}
  const previousY=actor.y;actor.velocityY-=8.8*dt;actor.y+=actor.velocityY*dt;actor.grounded=false;
  if(actor.velocityY<=0)for(const platform of PLATFORMS){
    if(actor.x<platform.from||actor.x>platform.to)continue;
    if(previousY>=platform.y-.01&&actor.y<=platform.y+.01){actor.y=platform.y;actor.velocityY=0;actor.grounded=true;break;}
  }
  actor.y=clamp(actor.y,0,HOUSE.height-.25);
}
export function createGame():Game{
  const player:InternalActor={x:1.8,y:0,velocityY:0,heading:0,stride:0,moving:false,stealth:false,grounded:true};
  const brother:InternalActor={x:1.35,y:0,velocityY:0,heading:0,stride:0,moving:false,stealth:false,grounded:true};
  return{room:{width:HOUSE.width,height:HOUSE.height},update(dt,horizontal,vertical,stealth){
    dt=clamp(dt,0,.04);simulate(player,dt,horizontal,vertical,stealth);
    brother.stealth=stealth;const dx=player.x-brother.x,dy=player.y-brother.y,distance=Math.hypot(dx,dy);brother.moving=false;
    if(distance>.48){const step=Math.min(distance-.48,(stealth?1.35:2.45)*dt);brother.x=clamp(brother.x+dx/distance*step,.18,HOUSE.width-.18);brother.y=clamp(brother.y+dy/distance*step,0,HOUSE.height-.25);brother.heading=dx>=0?0:Math.PI;brother.stride+=step*8;brother.moving=true;}
    brother.grounded=Math.abs(dy)<.08&&player.grounded;
  },player:()=>snapshot(player),brother:()=>snapshot(brother)};
}
