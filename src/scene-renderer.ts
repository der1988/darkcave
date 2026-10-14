import { LIGHT,ROOM_STYLE,VIEW } from "./config";
import type { Flashlight } from "./flashlight";
import type { Game } from "./game";
import { HOUSE,LADDERS,PLATFORMS,ROOMS,type HouseRoom } from "./house-world";
import { drawPerson } from "./player-sprite";

export class SceneRenderer{
  readonly ctx:CanvasRenderingContext2D;width=0;height=0;private scale=40;private cameraX=0;
  get room(){return this.game.room;}
  constructor(readonly canvas:HTMLCanvasElement,private game:Game,private flashlight:Flashlight){
    this.ctx=canvas.getContext("2d",{alpha:false})!;this.flashlight.setOccluders([]);this.resize();
  }
  resize(){this.width=Math.max(VIEW.minWidth,Math.ceil(innerWidth*VIEW.resolutionScale));this.height=Math.max(VIEW.minHeight,Math.ceil(innerHeight*VIEW.resolutionScale));this.canvas.width=this.width;this.canvas.height=this.height;this.ctx.imageSmoothingEnabled=false;}
  private sx(x:number){return Math.round(x*this.scale+this.cameraX);}
  private sy(y:number){return Math.round(this.height-22-y*this.scale);}
  aimFromPointer(clientX:number,clientY:number,rect:DOMRect){
    const x=(clientX-rect.left)/rect.width*this.width,y=(clientY-rect.top)/rect.height*this.height,player=this.game.player();
    this.flashlight.aim({x:(x-this.cameraX)/this.scale-player.x,y:(this.height-22-y)/this.scale-player.y});
  }
  private drawFurniture(room:HouseRoom,x:number,floorY:number){
    const c=this.ctx,s=this.scale,left=this.sx(x),base=this.sy(floorY);c.fillStyle=room.trim;
    if(room.id==="bedroom"||room.id==="nursery"){c.fillRect(left+10,base-13,Math.round(s*1.25),12);c.fillStyle="#242626";c.fillRect(left+10,base-18,10,5);}
    if(room.id==="kitchen"){c.fillRect(left+12,base-22,Math.round(s*1.45),21);c.fillStyle="#0c1010";c.fillRect(left+18,base-18,14,13);}
    if(room.id==="bath"){c.strokeStyle=room.trim;c.lineWidth=3;c.strokeRect(left+15,base-24,Math.round(s*.85),22);}
    if(room.id==="archive")for(let i=0;i<3;i++)c.fillRect(left+12+i*18,base-10-i*4,14,9+i*4);
    if(room.id==="memory"){c.fillStyle="#85676b";c.fillRect(left+Math.round(s*1.8),base-16,14,14);}
    if(room.id==="window"){c.fillStyle="#17252c";c.fillRect(left+Math.round(s*1.45),base-Math.round(s*1.9),Math.round(s*1.1),Math.round(s*.8));c.strokeStyle=room.trim;c.strokeRect(left+Math.round(s*1.45),base-Math.round(s*1.9),Math.round(s*1.1),Math.round(s*.8));}
    if(room.id==="sealed"){c.fillStyle="#27292a";c.fillRect(left+Math.round(s*1.6),base-Math.round(s*1.8),Math.round(s*.8),Math.round(s*1.8));}
  }
  private drawHouse(){
    const c=this.ctx,s=this.scale;
    for(const room of ROOMS){const x=room.column*HOUSE.roomWidth,y=room.floor*HOUSE.floorHeight,top=this.sy(y+HOUSE.floorHeight),left=this.sx(x);
      c.fillStyle=room.background;c.fillRect(left,top,Math.ceil(HOUSE.roomWidth*s),Math.ceil(HOUSE.floorHeight*s));
      c.fillStyle=room.trim;c.globalAlpha=.16;c.fillRect(left,top,Math.ceil(HOUSE.roomWidth*s),2);c.globalAlpha=1;
      c.fillStyle="rgba(180,185,176,.15)";c.font="5px monospace";c.fillText(room.label,left+7,top+10);this.drawFurniture(room,x,y);
    }
    c.fillStyle="#080a0a";for(const p of PLATFORMS)c.fillRect(this.sx(p.from),this.sy(p.y),Math.ceil((p.to-p.from)*s),4);
    for(let floor=0;floor<3;floor++)for(const x of [4,8,12]){const base=floor*HOUSE.floorHeight;c.fillStyle="#0d1010";c.fillRect(this.sx(x)-2,this.sy(base+HOUSE.floorHeight),4,Math.round((HOUSE.floorHeight-.78)*s));}
    for(const ladder of LADDERS){const x=this.sx(ladder.x),top=this.sy(ladder.toY),bottom=this.sy(ladder.fromY);c.fillStyle="#343b38";c.fillRect(x-7,top,2,bottom-top);c.fillRect(x+5,top,2,bottom-top);for(let y=top+7;y<bottom;y+=9)c.fillRect(x-6,y,12,1);}
    c.strokeStyle="#252a28";c.lineWidth=3;c.strokeRect(this.sx(0),this.sy(HOUSE.height),Math.round(HOUSE.width*s),Math.round(HOUSE.height*s));
  }
  private drawLight(){
    if(this.flashlight.brightness<.01)return;const c=this.ctx,s=this.scale,player=this.game.player(),origin=this.flashlight.origin(player),range=this.flashlight.range;
    const ox=this.sx(origin.x),oy=this.sy(origin.y+LIGHT.lensHeight*.45),angle=-this.flashlight.angle,tx=ox+Math.cos(angle)*range*this.scale,ty=oy+Math.sin(angle)*range*this.scale;
    const radius=this.flashlight.beamRadius(range)*this.scale,px=-Math.sin(angle)*radius,py=Math.cos(angle)*radius;
    const gradient=c.createLinearGradient(ox,oy,tx,ty);gradient.addColorStop(0,`rgba(255,238,178,${.42*this.flashlight.brightness})`);gradient.addColorStop(.55,`rgba(231,215,163,${.25*this.flashlight.brightness})`);gradient.addColorStop(1,"rgba(190,182,145,.04)");
    c.save();c.globalCompositeOperation="lighter";c.beginPath();c.moveTo(ox,oy);c.lineTo(tx+px,ty+py);c.lineTo(tx-px,ty-py);c.closePath();c.fillStyle=gradient;c.fill();
    const glow=c.createRadialGradient(ox,oy,0,ox,oy,s*.75);glow.addColorStop(0,"rgba(255,235,175,.12)");glow.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=glow;c.fillRect(ox-s,oy-s,s*2,s*2);c.restore();
  }
  private drawActors(now:number){
    const player=this.game.player(),brother=this.game.brother(),origin=this.flashlight.origin(player);
    for(const [actor,child] of [[brother,true],[player,false]] as const){const brightness=.65+this.flashlight.at(actor,origin,this.game.room)*.35;
      const lens=!child?{x:this.sx(origin.x),y:this.sy(origin.y+LIGHT.lensHeight*.45)}:undefined;
      drawPerson(this.ctx,this.sx(actor.x),this.sy(actor.y),actor.heading,actor.stride,child,Math.min(1.15,brightness),now/1000,actor.moving,lens,child?0:this.flashlight.holdProgress,actor.stealth);}
  }
  render(now:number){
    const player=this.game.player(),worldWidth=HOUSE.width*this.scale;this.cameraX=worldWidth<=this.width?(this.width-worldWidth)/2:Math.max(this.width-worldWidth-12,Math.min(12,this.width/2-player.x*this.scale));
    this.ctx.fillStyle=ROOM_STYLE.background;this.ctx.fillRect(0,0,this.width,this.height);this.drawHouse();this.drawLight();this.drawActors(now);
  }
}
