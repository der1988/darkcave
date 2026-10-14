import type { LightOccluder } from "./flashlight";

export type RoomProp=LightOccluder&{height:number;color:[number,number,number]};

export const ROOM_PROPS:RoomProp[]=[{
  minX:5.08,minY:1.04,maxX:5.5,maxY:1.46,height:.42,color:[96,87,70],
}];
