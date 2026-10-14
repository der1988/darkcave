export const ROOM_WIDTH=4;
export const ROOM_HEIGHT=3;
export const DOOR_MIN=1.12;
export const DOOR_MAX=1.88;

export const ZONES=[
  {id:"lit",minX:0,maxX:4,light:"lit"},
  {id:"dim",minX:4,maxX:8,light:"dim"},
  {id:"dark",minX:8,maxX:12,light:"dark"},
] as const;

export const WORLD={width:ROOM_WIDTH*ZONES.length,height:ROOM_HEIGHT};

export const CUBES=[
  {minX:1.05,minY:.72,maxX:1.47,maxY:1.14,height:.42,color:[119,79,61] as [number,number,number]},
  {minX:5.18,minY:2.05,maxX:5.6,maxY:2.47,height:.42,color:[91,103,94] as [number,number,number]},
  {minX:9.72,minY:.72,maxX:10.14,maxY:1.14,height:.42,color:[73,83,105] as [number,number,number]},
];
