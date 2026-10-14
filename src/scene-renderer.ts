import { LIGHT,ROOM_STYLE,VIEW } from "./config";
import type { Flashlight } from "./flashlight";
import type { Game } from "./game";
import { drawPerson } from "./player-sprite";
import { ROOM } from "./room";

type Point={x:number;y:number};
const project=(x:number,y:number,z=0):Point=>({x:(x-y)*VIEW.isoX,y:(x+y)*VIEW.isoY-z*VIEW.isoZ});
const unproject=(x:number,y:number):Point=>({x:x/(VIEW.isoX*2)+y/(VIEW.isoY*2),y:y/(VIEW.isoY*2)-x/(VIEW.isoX*2)});

export class SceneRenderer{
  readonly ctx:CanvasRenderingContext2D;width=0;height=0;private camera={x:0,y:0};
  get room(){return this.game.room;}
  constructor(readonly canvas:HTMLCanvasElement,private game:Game,private flashlight:Flashlight){this.ctx=canvas.getContext("2d",{alpha:false})!;this.flashlight.setOccluders([]);this.resize();}
  resize(){this.width=Math.max(VIEW.minWidth,Math.ceil(innerWidth*VIEW.resolutionScale));this.height=Math.max(VIEW.minHeight,Math.ceil(innerHeight*VIEW.resolutionScale));this.canvas.width=this.width;this.canvas.height=this.height;this.ctx.imageSmoothingEnabled=false;this.updateCamera();}
  private updateCamera(){const center=project(ROOM.width/2,ROOM.height/2);this.camera={x:Math.round(this.width/2-center.x),y:Math.round(this.height/2-center.y+35)};}
  private path(points:[number,number,number][]){this.ctx.beginPath();points.forEach(([x,y,z],index)=>{const p=project(x,y,z);if(index)this.ctx.lineTo(p.x+this.camera.x,p.y+this.camera.y);else this.ctx.moveTo(p.x+this.camera.x,p.y+this.camera.y);});this.ctx.closePath();}
  private roomClip(){
    const surfaces:[number,number,number][][]=[[[0,0,0],[ROOM.width,0,0],[ROOM.width,ROOM.height,0],[0,ROOM.height,0]],[[0,0,0],[ROOM.width,0,0],[ROOM.width,0,ROOM.wallHeight],[0,0,ROOM.wallHeight]],[[0,0,0],[0,ROOM.height,0],[0,ROOM.height,ROOM.wallHeight],[0,0,ROOM.wallHeight]]];
    this.ctx.beginPath();for(const surface of surfaces)surface.forEach(([x,y,z],index)=>{const p=project(x,y,z);if(index)this.ctx.lineTo(p.x+this.camera.x,p.y+this.camera.y);else this.ctx.moveTo(p.x+this.camera.x,p.y+this.camera.y);});
  }
  aimFromPointer(clientX:number,clientY:number,rect:DOMRect){const sx=(clientX-rect.left)/rect.width*this.width-this.camera.x,sy=(clientY-rect.top)/rect.height*this.height-this.camera.y,target=unproject(sx,sy),player=this.game.player();this.flashlight.aim({x:target.x-player.x,y:target.y-player.y});}
  private drawRoom(){
    this.path([[0,0,0],[ROOM.width,0,0],[ROOM.width,ROOM.height,0],[0,ROOM.height,0]]);this.ctx.fillStyle="#111715";this.ctx.fill();
    this.path([[0,0,0],[ROOM.width,0,0],[ROOM.width,0,ROOM.wallHeight],[0,0,ROOM.wallHeight]]);this.ctx.fillStyle="#1a211e";this.ctx.fill();
    this.path([[0,0,0],[0,ROOM.height,0],[0,ROOM.height,ROOM.wallHeight],[0,0,ROOM.wallHeight]]);this.ctx.fillStyle="#151c1a";this.ctx.fill();
    this.ctx.strokeStyle="rgba(104,116,109,.18)";this.ctx.lineWidth=1;for(const line of [[[0,0,0],[ROOM.width,0,0]],[[0,0,0],[0,ROOM.height,0]],[[0,0,0],[0,0,ROOM.wallHeight]]] as [number,number,number][][]){this.path(line);this.ctx.stroke();}
  }
  private drawLight(){
    if(this.flashlight.brightness<.01)return;const player=this.game.player(),origin=this.flashlight.origin(player),range=this.flashlight.effectiveRange(origin,this.game.room),angle=this.flashlight.angle;
    const direction={x:Math.cos(angle),y:Math.sin(angle)},perpendicular={x:-direction.y,y:direction.x},radius=this.flashlight.beamRadius(range)*1.25;
    const start=project(origin.x,origin.y,LIGHT.lensHeight),left=project(origin.x+direction.x*range+perpendicular.x*radius,origin.y+direction.y*range+perpendicular.y*radius,0),right=project(origin.x+direction.x*range-perpendicular.x*radius,origin.y+direction.y*range-perpendicular.y*radius,0);
    const ox=start.x+this.camera.x,oy=start.y+this.camera.y,tx=(left.x+right.x)/2+this.camera.x,ty=(left.y+right.y)/2+this.camera.y,gradient=this.ctx.createLinearGradient(ox,oy,tx,ty);
    gradient.addColorStop(0,`rgba(255,239,185,${.48*this.flashlight.brightness})`);gradient.addColorStop(.58,`rgba(235,220,171,${.25*this.flashlight.brightness})`);gradient.addColorStop(1,"rgba(200,194,163,.07)");
    this.ctx.save();this.roomClip();this.ctx.clip();this.ctx.globalCompositeOperation="lighter";this.ctx.beginPath();this.ctx.moveTo(ox,oy);this.ctx.lineTo(left.x+this.camera.x,left.y+this.camera.y);this.ctx.lineTo(right.x+this.camera.x,right.y+this.camera.y);this.ctx.closePath();this.ctx.fillStyle=gradient;this.ctx.fill();this.ctx.restore();
  }
  private drawActors(now:number){
    const player=this.game.player(),brother=this.game.brother(),origin=this.flashlight.origin(player);for(const [actor,child] of [[brother,true],[player,false]] as const){const p=project(actor.x,actor.y),light=.48+this.flashlight.at(actor,origin,this.game.room)*.42,lens=!child?project(origin.x,origin.y,LIGHT.lensHeight):undefined;
      drawPerson(this.ctx,Math.round(p.x+this.camera.x),Math.round(p.y+this.camera.y),actor.heading,actor.stride,child,Math.min(1.15,light),now/1000,actor.moving,lens?{x:lens.x+this.camera.x,y:lens.y+this.camera.y}:undefined,child?0:this.flashlight.holdProgress,actor.stealth);}
  }
  render(now:number){this.ctx.fillStyle=ROOM_STYLE.background;this.ctx.fillRect(0,0,this.width,this.height);this.drawRoom();this.drawLight();this.drawActors(now);}
}
