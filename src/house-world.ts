export type HouseRoom={id:string;floor:number;column:number;background:string;trim:string;label:string};
export type Platform={y:number;from:number;to:number};
export type Ladder={x:number;fromY:number;toY:number};
export const HOUSE={width:16,height:8.4,floorHeight:2.8,roomWidth:4};
const themes=[
  ["bedroom","#191b1d","#59605d","CAMERA"],["hall","#1b1916","#6d6451","CORRIDOIO"],
  ["kitchen","#171c1b","#526762","CUCINA"],["empty","#19181b","#625969","STANZA VUOTA"],
  ["nursery","#1c1a17","#776b55","CAMERETTA"],["bath","#161c1d","#526b70","BAGNO"],
  ["landing","#181918","#62635c","PIANEROTTOLO"],["sealed","#151617","#4e5051","PORTA CHIUSA"],
  ["attic","#171512","#655846","SOFFITTA"],["archive","#151817","#56625b","ARCHIVIO"],
  ["memory","#1b1718","#72575d","RICORDO"],["window","#15191c","#506477","FINESTRA"],
] as const;
export const ROOMS:HouseRoom[]=themes.map(([id,background,trim,label],index)=>({id,floor:Math.floor(index/4),column:index%4,background,trim,label}));
export const PLATFORMS:Platform[]=[
  {y:0,from:0,to:16},{y:2.8,from:0,to:3.15},{y:2.8,from:3.85,to:16},
  {y:5.6,from:0,to:12.15},{y:5.6,from:12.85,to:16},
];
export const LADDERS:Ladder[]=[{x:3.5,fromY:0,toY:2.8},{x:12.5,fromY:2.8,toY:5.6}];
