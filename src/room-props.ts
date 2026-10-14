import type { LightOccluder } from "./flashlight";

export type RoomProp=LightOccluder&{height:number;color:[number,number,number]};

export const ROOM_PROPS:RoomProp[]=[{
  minX:5.12,minY:1.08,maxX:5.46,maxY:1.42,height:.34,color:[83,69,48],
}];
