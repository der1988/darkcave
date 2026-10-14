import { ROOM_STYLE,VIEW } from "./config";
import type { ActorState,Game } from "./game";
import { drawPerson } from "./player-sprite";
import { ROOM } from "./room";

type Point={x:number;y:number};
type WindowDef={from:number;to:number;bottom:number;top:number};
const WINDOWS:WindowDef[]=[{from:.9,to:1.75,bottom:.43,top:1.13},{from:3.7,to:4.65,bottom:.43,top:1.13}];
const project=(x:number,y:number,z=0):Point=>({x:(x-y)*VIEW.isoX,y:(x+y)*VIEW.isoY-z*VIEW.isoZ});

export class SceneRenderer{
  readonly ctx:CanvasRenderingContext2D;width=0;height=0;private camera={x:0,y:0};
  get room(){return this.game.room;}
  constructor(readonly canvas:HTMLCanvasElement,private game:Game){this.ctx=canvas.getContext("2d",{alpha:false})!;this.resize();}
  resize(){this.width=Math.max(VIEW.minWidth,Math.ceil(innerWidth*VIEW.resolutionScale));this.height=Math.max(VIEW.minHeight,Math.ceil(innerHeight*VIEW.resolutionScale));this.canvas.width=this.width;this.canvas.height=this.height;this.ctx.imageSmoothingEnabled=false;this.updateCamera();}
  private updateCamera(){const center=project(ROOM.width/2,ROOM.height/2);this.camera={x:Math.round(this.width/2-center.x),y:Math.round(this.height/2-center.y+35)};}
  private path(points:[number,number,number][]){this.ctx.beginPath();points.forEach(([x,y,z],index)=>{const p=project(x,y,z);if(index)this.ctx.lineTo(p.x+this.camera.x,p.y+this.camera.y);else this.ctx.moveTo(p.x+this.camera.x,p.y+this.camera.y);});this.ctx.closePath();}
  private drawRoom(){
    this.path([[0,0,0],[ROOM.width,0,0],[ROOM.width,ROOM.height,0],[0,ROOM.height,0]]);this.ctx.fillStyle="#101614";this.ctx.fill();
    this.path([[0,0,0],[ROOM.width,0,0],[ROOM.width,0,ROOM.wallHeight],[0,0,ROOM.wallHeight]]);this.ctx.fillStyle="#19211e";this.ctx.fill();
    this.path([[0,0,0],[0,ROOM.height,0],[0,ROOM.height,ROOM.wallHeight],[0,0,ROOM.wallHeight]]);this.ctx.fillStyle="#141b19";this.ctx.fill();
    this.ctx.strokeStyle="rgba(104,116,109,.17)";this.ctx.lineWidth=1;for(const line of [[[0,0,0],[ROOM.width,0,0]],[[0,0,0],[0,ROOM.height,0]],[[0,0,0],[0,0,ROOM.wallHeight]]] as [number,number,number][][]){this.path(line);this.ctx.stroke();}
  }
  private daylight(now:number){
    const phase=now*.000075,drift=Math.sin(phase)*.38,intensity=.78+Math.sin(phase*.63+.8)*.12,depth=3.25;
    for(const window of WINDOWS){
      this.path([[window.from,0,window.bottom],[window.to,0,window.bottom],[window.to,0,window.top],[window.from,0,window.top]]);
      const wallGlow=this.ctx.createLinearGradient(0,this.camera.y-20,0,this.camera.y+45);wallGlow.addColorStop(0,`rgba(178,205,202,${.72*intensity})`);wallGlow.addColorStop(1,`rgba(113,145,143,${.46*intensity})`);this.ctx.fillStyle=wallGlow;this.ctx.fill();
      this.ctx.strokeStyle="rgba(25,35,34,.85)";this.ctx.lineWidth=2;this.ctx.stroke();const middle=(window.from+window.to)/2;this.path([[middle,0,window.bottom],[middle,0,window.top]]);this.ctx.stroke();
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
