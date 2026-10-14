export const ROOM={width:9.6,height:6,wallHeight:1.4};
export type RoomZone={id:string;label:string;minX:number;maxX:number;minY:number;maxY:number;floor:string};
export const ROOMS:RoomZone[]=[
  {id:"yellow",label:"STANZE GIALLE",minX:0,maxX:3.2,minY:0,maxY:3,floor:"#201f16"},
  {id:"pool",label:"POOLROOMS",minX:3.2,maxX:6.4,minY:0,maxY:3,floor:"#132021"},
  {id:"office",label:"UFFICIO VUOTO",minX:6.4,maxX:9.6,minY:0,maxY:3,floor:"#191c19"},
  {id:"mall",label:"CENTRO COMMERCIALE",minX:0,maxX:4.8,minY:3,maxY:6,floor:"#1b1918"},
  {id:"play",label:"AREA GIOCHI",minX:4.8,maxX:9.6,minY:3,maxY:6,floor:"#17191b"},
];
export type Wall={axis:"x"|"y";position:number;from:number;to:number};
const door=(axis:Wall["axis"],position:number,from:number,to:number,center:number,width=.72):Wall[]=>[
  {axis,position,from,to:center-width/2},{axis,position,from:center+width/2,to},
];
export const WALLS:Wall[]=[
  ...door("x",3.2,0,3,1.5,.86),...door("x",6.4,0,3,1.5,.86),
  ...door("y",3,0,3.2,1.6,.92),...door("y",3,3.2,6.4,4.65,.92),...door("y",3,6.4,9.6,8,.92),
  ...door("x",4.8,3,6,4.5,.92),
];
export const WINDOWS=[{from:.55,to:1.35},{from:3.65,to:4.45},{from:5.15,to:5.95},{from:7.25,to:8.05}] as const;
