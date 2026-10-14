export const ROOM={width:8,height:6,wallHeight:1.4};
export type RoomZone={id:string;label:string;minX:number;maxX:number;minY:number;maxY:number;floor:string};
export const ROOMS:RoomZone[]=[
  {id:"bedroom",label:"CAMERA",minX:0,maxX:4,minY:0,maxY:2.5,floor:"#101714"},
  {id:"bathroom",label:"BAGNO",minX:4,maxX:8,minY:0,maxY:2.5,floor:"#11191a"},
  {id:"hall",label:"CORRIDOIO",minX:0,maxX:8,minY:2.5,maxY:3.5,floor:"#151714"},
  {id:"living",label:"SOGGIORNO",minX:0,maxX:4,minY:3.5,maxY:6,floor:"#151411"},
  {id:"kitchen",label:"CUCINA",minX:4,maxX:8,minY:3.5,maxY:6,floor:"#111716"},
];
export type Wall={axis:"x"|"y";position:number;from:number;to:number};
const door=(axis:Wall["axis"],position:number,from:number,to:number,center:number,width=.72):Wall[]=>[
  {axis,position,from,to:center-width/2},{axis,position,from:center+width/2,to},
];
export const WALLS:Wall[]=[
  {axis:"x",position:4,from:0,to:2.5},
  ...door("y",2.5,0,4,2.15),...door("y",2.5,4,8,5.85),
  ...door("y",3.5,0,4,1.85),...door("y",3.5,4,8,6.15),
  {axis:"x",position:4,from:3.5,to:6},
];
export const WINDOWS=[{from:.75,to:1.65},{from:5.1,to:6.05},{from:6.45,to:7.35}] as const;
