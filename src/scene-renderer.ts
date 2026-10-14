import { ROOM_STYLE,VIEW } from "./config";
import type { ActorState,Game } from "./game";
import { drawPerson } from "./player-sprite";
import { ROOM,ROOMS,WALLS,WINDOWS } from "./room";

type Point={x:number;y:number};
const project=(x:number,y:number,z=0):Point=>({x:(x-y)*VIEW.isoX,y:(x+y)*VIEW.isoY-z*VIEW.isoZ});

export class SceneRenderer{
  readonly ctx:CanvasRenderingContext2D;width=0;height=0;private camera={x:0,y:0};
  get room(){return this.game.room;}
  constructor(readonly canvas:HTMLCanvasElement,private game:Game){this.ctx=canvas.getContext("2d",{alpha:false})!;this.resize();}
  resize(){this.width=Math.max(VIEW.minWidth,Math.ceil(innerWidth*VIEW.resolutionScale));this.height=Math.max(VIEW.minHeight,Math.ceil(innerHeight*VIEW.resolutionScale));this.canvas.width=this.width;this.canvas.height=this.height;this.ctx.imageSmoothingEnabled=false;this.updateCamera();}
  private updateCamera(){const center=project(ROOM.width/2,ROOM.height/2);this.camera={x:Math.round(this.width/2-center.x),y:Math.round(this.height/2-center.y+35)};}
  private path(points:[number,number,number][]){this.ctx.beginPath();points.forEach(([x,y,z],index)=>{const p=project(x,y,z);if(index)this.ctx.lineTo(p.x+this.camera.x,p.y+this.camera.y);else this.ctx.moveTo(p.x+this.camera.x,p.y+this.camera.y);});this.ctx.closePath();}
  private drawRoom(){
    for(const room of ROOMS){this.path([[room.minX,room.minY,0],[room.maxX,room.minY,0],[room.maxX,room.maxY,0],[room.minX,room.maxY,0]]);this.ctx.fillStyle=room.floor;this.ctx.fill();const label=project(room.minX+.18,room.minY+.18,.005);this.ctx.fillStyle="rgba(130,140,133,.16)";this.ctx.font="5px monospace";this.ctx.fillText(room.label,label.x+this.camera.x,label.y+this.camera.y);}
    this.path([[0,0,0],[ROOM.width,0,0],[ROOM.width,0,ROOM.wallHeight],[0,0,ROOM.wallHeight]]);this.ctx.fillStyle="#19211e";this.ctx.fill();
    this.path([[0,0,0],[0,ROOM.height,0],[0,ROOM.height,ROOM.wallHeight],[0,0,ROOM.wallHeight]]);this.ctx.fillStyle="#141b19";this.ctx.fill();
    this.drawFurniture();
    for(const wall of WALLS){const points:[number,number,number][]=wall.axis==="x"?[[wall.position,wall.from,0],[wall.position,wall.to,0],[wall.position,wall.to,ROOM.wallHeight],[wall.position,wall.from,ROOM.wallHeight]]:[[wall.from,wall.position,0],[wall.to,wall.position,0],[wall.to,wall.position,ROOM.wallHeight],[wall.from,wall.position,ROOM.wallHeight]];this.path(points);this.ctx.fillStyle=wall.axis==="x"?"#151d1b":"#18201d";this.ctx.fill();this.ctx.strokeStyle="rgba(100,112,105,.14)";this.ctx.stroke();}
    this.ctx.strokeStyle="rgba(104,116,109,.17)";this.ctx.lineWidth=1;for(const line of [[[0,0,0],[ROOM.width,0,0]],[[0,0,0],[0,ROOM.height,0]],[[0,0,0],[0,0,ROOM.wallHeight]]] as [number,number,number][][]){this.path(line);this.ctx.stroke();}
  }
  private drawFurniture(){
    const footprint=(x:number,y:number,w:number,d:number,color:string)=>{this.path([[x,y,.015],[x+w,y,.015],[x+w,y+d,.015],[x,y+d,.015]]);this.ctx.fillStyle=color;this.ctx.fill();};
    footprint(.55,.55,1.45,.72,"#292b27");footprint(2.55,.55,.45,.45,"#343832");
    footprint(4.5,.55,1.05,.55,"#293536");footprint(6.55,.62,.48,.38,"#344345");
    footprint(.65,4.25,1.55,.55,"#3a332b");footprint(2.55,4.3,.78,.62,"#26231f");
    footprint(4.55,4.05,2.55,.42,"#293430");footprint(6.72,4.48,.38,1.02,"#313b37");
  }
  private daylight(now:number){
    const phase=now*.000075,drift=.34+Math.sin(phase)*.16,intensity=.78+Math.sin(phase*.63+.8)*.12,depth=2.32;
    for(const window of WINDOWS){
      const bottom=.43,top=1.13;this.path([[window.from,0,bottom],[window.to,0,bottom],[window.to,0,top],[window.from,0,top]]);
      const wallGlow=this.ctx.createLinearGradient(0,this.camera.y-20,0,this.camera.y+45);wallGlow.addColorStop(0,`rgba(178,205,202,${.72*intensity})`);wallGlow.addColorStop(1,`rgba(113,145,143,${.46*intensity})`);this.ctx.fillStyle=wallGlow;this.ctx.fill();
      this.ctx.strokeStyle="rgba(25,35,34,.85)";this.ctx.lineWidth=2;this.ctx.stroke();const middle=(window.from+window.to)/2;this.path([[middle,0,bottom],[middle,0,top]]);this.ctx.stroke();
      const floorFrom=window.from+.08,floorTo=window.to-.08;
      this.path([[floorFrom,0,.02],[floorTo,0,.02],[floorTo+drift,depth,.02],[floorFrom+drift,depth,.02]]);
      const start=project(middle,0,0),end=project(middle+drift,depth,0),beam=this.ctx.createLinearGradient(start.x+this.camera.x,start.y+this.camera.y,end.x+this.camera.x,end.y+this.camera.y);
      beam.addColorStop(0,`rgba(177,203,195,${.27*intensity})`);beam.addColorStop(.72,`rgba(145,172,165,${.16*intensity})`);beam.addColorStop(1,"rgba(118,146,140,.02)");this.ctx.save();this.ctx.globalCompositeOperation="lighter";this.ctx.fillStyle=beam;this.ctx.fill();this.ctx.restore();
    }
    return{drift,intensity,depth};
  }
  private illumination(actor:ActorState,light:{drift:number;intensity:number;depth:number}){
    if(actor.y<0||actor.y>light.depth)return .34;const travel=actor.y/light.depth;
    for(const window of WINDOWS){const from=window.from+.08+light.drift*travel,to=window.to-.08+light.drift*travel;if(actor.x>=from-.12&&actor.x<=to+.12)return .52+light.intensity*.48;}
    return .38;
  }
  private drawShadow(actor:ActorState,light:{drift:number;intensity:number;depth:number}){
    if(this.illumination(actor,light)<.6)return;const awayX=light.drift*.22,awayY=.42,length=actor.stealth?.38:.55;
    const base=project(actor.x,actor.y,.005),tip=project(actor.x+awayX*length,actor.y+awayY*length,.005);this.ctx.beginPath();this.ctx.moveTo(base.x+this.camera.x-3,base.y+this.camera.y);this.ctx.lineTo(base.x+this.camera.x+3,base.y+this.camera.y);this.ctx.lineTo(tip.x+this.camera.x+2,tip.y+this.camera.y);this.ctx.lineTo(tip.x+this.camera.x-2,tip.y+this.camera.y);this.ctx.closePath();this.ctx.fillStyle=`rgba(0,0,0,${.34*light.intensity})`;this.ctx.fill();
  }
  private drawActors(now:number,light:{drift:number;intensity:number;depth:number}){
    const player=this.game.player(),brother=this.game.brother();this.drawShadow(brother,light);this.drawShadow(player,light);
    for(const [actor,child] of [[brother,true],[player,false]] as const){const p=project(actor.x,actor.y);drawPerson(this.ctx,Math.round(p.x+this.camera.x),Math.round(p.y+this.camera.y),actor.heading,actor.stride,child,this.illumination(actor,light),now/1000,actor.moving,undefined,0,actor.stealth);}
  }
  render(now:number){this.ctx.fillStyle=ROOM_STYLE.background;this.ctx.fillRect(0,0,this.width,this.height);this.drawRoom();const light=this.daylight(now);this.drawActors(now,light);}
}
