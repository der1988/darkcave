import type { LightOccluder } from "./flashlight";
import { CUBES } from "./world";

export type RoomProp=LightOccluder&{height:number;color:[number,number,number]};

export const ROOM_PROPS:RoomProp[]=CUBES;
