import test from "node:test";
import assert from "node:assert/strict";
import { ROOM } from "../src/room.ts";

test("the foundation contains one compact isometric room",()=>{
  assert.deepEqual(ROOM,{width:6,height:4.5,wallHeight:1.4});
});
