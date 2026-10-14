import * as THREE from "three";
import { LIGHT, ROOM_STYLE, VIEW } from "./config";
import type { Flashlight } from "./flashlight";
import type { ActorState, Game } from "./game";
import { CUBES, WALLS, WORLD, ZONES, type Zone } from "./world";

const WALL_THICKNESS=.08;
const standard=(value:string,roughness=.92)=>new THREE.MeshStandardMaterial({color:value,roughness,metalness:.02});

function box(scene:THREE.Scene,size:THREE.Vector3,position:THREE.Vector3,material:THREE.Material){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),material);
  mesh.position.copy(position);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}

function createActor(scene:THREE.Scene,coat:string,skin:string){
  const root=new THREE.Group();
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.18,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.38,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.008;root.add(shadow);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.2,.32,.14),standard(coat,.86));body.position.y=.34;root.add(body);
  const head=new THREE.Mesh(new THREE.BoxGeometry(.15,.17,.15),standard(skin,.95));head.position.y=.59;root.add(head);
  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.07,.28,.07),standard(coat,.88));arm.position.set(side*.14,.35,0);root.add(arm);
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.075,.25,.09),standard("#252c2c",.95));leg.position.set(side*.055,.13,0);root.add(leg);
  }
  root.traverse(object=>{if(object instanceof THREE.Mesh)object.castShadow=false;});scene.add(root);return root;
}

function addZoneDetail(scene:THREE.Scene,zone:Zone){
  const material=standard(zone.accent,1);
  const add=(x:number,z:number,w:number,d:number,h=.018)=>box(scene,new THREE.Vector3(w,h,d),new THREE.Vector3(zone.minX+x,.01+h/2,zone.minY+z),material);
  if(zone.id==="arrival")add(2,1.5,1.15,.78);
  if(zone.id==="yellow")for(let x=.6;x<3.6;x+=.72)add(x,1.5,.09,2.05);
  if(zone.id==="service")for(let i=0;i<3;i++)add(.9+i*.82,.7+i*.45,.52,.08,.025);
  if(zone.id==="threshold"){add(.8,.75,.7,.7);add(2.9,2.05,.7,.7);}
  if(zone.id==="white")add(2,1.5,1.8,1.55);
  if(zone.id==="carpet"){add(2,.48,3.25,.13);add(2,2.52,3.25,.13);}
  if(zone.id==="storage")for(const [x,z] of [[.7,.65],[1.45,1.25],[2.25,.7],[3,1.95]])add(x,z,.3,.3);
  if(zone.id==="return"){add(.65,1.5,.13,1.9);add(1.7,2.38,2.2,.13);}
}

export class SceneRenderer{
  readonly renderer:THREE.WebGLRenderer;readonly scene=new THREE.Scene();readonly camera=new THREE.OrthographicCamera();
  width=0;height=0;private playerMesh:THREE.Group;private brotherMesh:THREE.Group;
  private torch:THREE.SpotLight;private torchTarget=new THREE.Object3D();
  private beam:THREE.Mesh<THREE.ConeGeometry,THREE.MeshBasicMaterial>;
  private raycaster=new THREE.Raycaster();private ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  get room(){return this.game.room;}

  constructor(readonly canvas:HTMLCanvasElement,private game:Game,private flashlight:Flashlight){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(1);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.scene.background=new THREE.Color("#020404");
    this.flashlight.setOccluders(WALLS.map(w=>w.axis==="x"?{minX:w.position-.04,maxX:w.position+.04,minY:w.from,maxY:w.to}:{minX:w.from,maxX:w.to,minY:w.position-.04,maxY:w.position+.04}));
    this.buildWorld();this.playerMesh=createActor(this.scene,"#546d6b","#bc8065");this.brotherMesh=createActor(this.scene,"#66584a","#a86f58");
    this.torch=new THREE.SpotLight(0xffedbd,520,LIGHT.initialRange+.5,THREE.MathUtils.degToRad(LIGHT.mainBeamDegrees/2),.68,1.35);
    this.torch.castShadow=true;this.torch.shadow.mapSize.set(1024,1024);this.torch.shadow.bias=-.00035;this.torch.target=this.torchTarget;this.scene.add(this.torch,this.torchTarget);
    this.beam=new THREE.Mesh(new THREE.ConeGeometry(1,1,32,1,true),new THREE.MeshBasicMaterial({color:0xffe5a8,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.beam.renderOrder=4;this.scene.add(this.beam);this.resize();
  }

  private buildWorld(){
    this.scene.add(new THREE.HemisphereLight(0x71807a,0x050606,.18));
    for(const zone of ZONES){
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(zone.maxX-zone.minX,zone.maxY-zone.minY),standard(zone.floor));
      floor.rotation.x=-Math.PI/2;floor.position.set((zone.minX+zone.maxX)/2,0,(zone.minY+zone.maxY)/2);floor.receiveShadow=true;this.scene.add(floor);addZoneDetail(this.scene,zone);
      if(zone.ambient>.2){const lamp=new THREE.PointLight(zone.accent,zone.ambient*42,3.4,2);lamp.position.set((zone.minX+zone.maxX)/2,1.18,(zone.minY+zone.maxY)/2);this.scene.add(lamp);}
    }
    const wallMaterial=(x:number,z:number)=>standard(ZONES.find(q=>x>=q.minX&&x<q.maxX&&z>=q.minY&&z<q.maxY)?.wall??"#171a18");
    const wall=(axis:"x"|"y",position:number,from:number,to:number)=>{const length=to-from,x=axis==="x"?position:(from+to)/2,z=axis==="x"?(from+to)/2:position;
      box(this.scene,new THREE.Vector3(axis==="x"?WALL_THICKNESS:length,ROOM_STYLE.wallHeight,axis==="x"?length:WALL_THICKNESS),new THREE.Vector3(x,ROOM_STYLE.wallHeight/2,z),wallMaterial(x-.02,z-.02));};
    for(const item of WALLS)wall(item.axis,item.position,item.from,item.to);
    wall("y",0,0,WORLD.width);wall("y",WORLD.height,0,WORLD.width);wall("x",0,0,WORLD.height);wall("x",WORLD.width,0,WORLD.height);
    for(const cube of CUBES){const w=cube.maxX-cube.minX,d=cube.maxY-cube.minY;
      box(this.scene,new THREE.Vector3(w,cube.height,d),new THREE.Vector3((cube.minX+cube.maxX)/2,cube.height/2,(cube.minY+cube.maxY)/2),new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(cube.color[0]/255,cube.color[1]/255,cube.color[2]/255),roughness:.82}));}
  }

  resize(){
    this.width=Math.max(VIEW.minWidth,Math.ceil(innerWidth*VIEW.resolutionScale));this.height=Math.max(VIEW.minHeight,Math.ceil(innerHeight*VIEW.resolutionScale));this.renderer.setSize(this.width,this.height,false);
    const aspect=this.width/this.height,view=3.4;this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.near=.1;this.camera.far=40;this.camera.updateProjectionMatrix();
  }

  aimFromPointer(clientX:number,clientY:number,rect:DOMRect){
    const pointer=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);this.raycaster.setFromCamera(pointer,this.camera);const hit=new THREE.Vector3();
    if(this.raycaster.ray.intersectPlane(this.ground,hit)){const player=this.game.player();this.flashlight.aim({x:hit.x-player.x,y:hit.z-player.y});}
  }

  private updateActor(mesh:THREE.Group,actor:ActorState,time:number){
    mesh.position.set(actor.x,actor.stealth?-.055:0,actor.y);mesh.rotation.y=-actor.heading+Math.PI/2;
    mesh.position.y+=actor.moving?Math.abs(Math.sin(actor.stride))*.025:Math.sin(time*.002)*.006;mesh.scale.y=actor.stealth?.82:1;
  }

  render(now:number){
    const player=this.game.player(),brother=this.game.brother();this.updateActor(this.playerMesh,player,now);this.updateActor(this.brotherMesh,brother,now);
    const focus=new THREE.Vector3(player.x,.25,player.y);this.camera.position.set(player.x+5.8,7.4,player.y+5.8);this.camera.lookAt(focus);this.camera.updateMatrixWorld();
    const origin=this.flashlight.origin(player),range=this.flashlight.effectiveRange(origin,this.game.room);const direction=new THREE.Vector3(Math.cos(this.flashlight.angle),-.035,Math.sin(this.flashlight.angle)).normalize();
    this.torch.position.set(origin.x,LIGHT.lensHeight-(player.stealth?.1:0),origin.y);this.torchTarget.position.copy(this.torch.position).addScaledVector(direction,range);
    this.torch.intensity=520*this.flashlight.brightness;this.torch.distance=range+.55;this.torch.visible=this.flashlight.brightness>.01;
    const radius=this.flashlight.beamRadius(range)*1.15;this.beam.visible=this.torch.visible;this.beam.scale.set(radius,range,radius);this.beam.position.copy(this.torch.position).addScaledVector(direction,range/2);
    this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),direction);this.beam.material.opacity=.075*this.flashlight.brightness;this.renderer.render(this.scene,this.camera);
  }
}
