export const ROOM_WIDTH=4;
export const ROOM_HEIGHT=3;
export const DOOR_HALF=.38;

export type Zone={
  id:string;minX:number;maxX:number;minY:number;maxY:number;
  ambient:number;floor:string;wall:string;accent:string;
};

export const ZONES:Zone[]=[
  {id:"arrival",minX:0,maxX:4,minY:0,maxY:3,ambient:.82,floor:"#373832",wall:"#494a42",accent:"#817b65"},
  {id:"yellow",minX:4,maxX:8,minY:0,maxY:3,ambient:.42,floor:"#25241d",wall:"#39362a",accent:"#8b8158"},
  {id:"service",minX:8,maxX:12,minY:0,maxY:3,ambient:.08,floor:"#080b0b",wall:"#101515",accent:"#56605b"},
  {id:"threshold",minX:8,maxX:12,minY:3,maxY:6,ambient:.25,floor:"#151817",wall:"#242724",accent:"#72766d"},
  {id:"white",minX:8,maxX:12,minY:6,maxY:9,ambient:.62,floor:"#343735",wall:"#50534e",accent:"#a2a398"},
  {id:"carpet",minX:4,maxX:8,minY:6,maxY:9,ambient:.32,floor:"#211c1b",wall:"#302827",accent:"#745f58"},
  {id:"storage",minX:0,maxX:4,minY:6,maxY:9,ambient:.06,floor:"#070808",wall:"#0e1010",accent:"#4d514c"},
  {id:"return",minX:0,maxX:4,minY:3,maxY:6,ambient:.2,floor:"#121615",wall:"#202522",accent:"#5d6b62"},
];

export const WORLD={width:12,height:9};

export type Wall={axis:"x"|"y";position:number;from:number;to:number};
const split=(axis:Wall["axis"],position:number,from:number,to:number,door:number):Wall[]=>[
  {axis,position,from,to:door-DOOR_HALF},{axis,position,from:door+DOOR_HALF,to},
];
export const WALLS:Wall[]=[
  ...split("x",4,0,3,1.5),{axis:"x",position:4,from:3,to:6},...split("x",4,6,9,7.5),
  ...split("x",8,0,3,1.5),{axis:"x",position:8,from:3,to:6},...split("x",8,6,9,7.5),
  ...split("y",3,0,4,2),{axis:"y",position:3,from:4,to:8},...split("y",3,8,12,10),
  ...split("y",6,0,4,2),{axis:"y",position:6,from:4,to:8},...split("y",6,8,12,10),
];
export const WALL_OCCLUDERS=WALLS.map(wall=>wall.axis==="x"
  ?{minX:wall.position-.025,maxX:wall.position+.025,minY:wall.from,maxY:wall.to}
  :{minX:wall.from,maxX:wall.to,minY:wall.position-.025,maxY:wall.position+.025});

export const CUBES=ZONES.map((zone,index)=>{
  const offsets=[[.78,.65],[2.72,.72],[2.58,.62],[2.8,1.92],[.72,1.82],[2.76,1.76],[.7,.68],[.72,1.78]][index];
  const minX=zone.minX+offsets[0],minY=zone.minY+offsets[1],size=.42;
  const colors:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],
    [number,number,number],[number,number,number],[number,number,number],[number,number,number]]=
    [[119,79,61],[125,111,70],[70,83,80],[103,101,91],[136,137,129],[105,76,70],[74,78,72],[77,99,87]];
  return {minX,minY,maxX:minX+size,maxY:minY+size,height:size,color:colors[index]};
});

export function zoneAt(x:number,y:number){
  return ZONES.find(zone=>x>=zone.minX&&x<zone.maxX&&y>=zone.minY&&y<zone.maxY);
}
