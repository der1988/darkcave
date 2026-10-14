export type ActorState = { x:number; y:number; heading:number; stride:number; moving:boolean };
export type Game = {
  room:{width:number;height:number};
  update(dt:number,horizontal:number,vertical:number,running:boolean):void;
  player():ActorState; brother():ActorState;
};
const ROOM={width:8,height:6},CUBE={minX:5.12,minY:1.08,maxX:5.46,maxY:1.42};
const margin=.24,radius=.17;
const clamp=(v:number,low:number,high:number)=>Math.max(low,Math.min(high,v));
const blocked=(x:number,y:number)=>x>CUBE.minX-radius&&x<CUBE.maxX+radius&&y>CUBE.minY-radius&&y<CUBE.maxY+radius;
function move(actor:ActorState,dx:number,dy:number) {
  const x=clamp(actor.x+dx,margin,ROOM.width-margin); if(!blocked(x,actor.y)) actor.x=x;
  const y=clamp(actor.y+dy,margin,ROOM.height-margin); if(!blocked(actor.x,y)) actor.y=y;
}
export function createGame():Game {
  const player:ActorState={x:4.2,y:3.15,heading:-.78,stride:0,moving:false};
  const brother:ActorState={x:3.76,y:3.47,heading:-.78,stride:0,moving:false};
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
