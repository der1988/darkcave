import test from "node:test";
import assert from "node:assert/strict";
import { ROOM,ROOMS,WALLS,WINDOWS } from "../src/room.ts";

test("the house contains five connected rooms",()=>{
  assert.deepEqual(ROOM,{width:8,height:6,wallHeight:1.4});assert.equal(ROOMS.length,5);assert.equal(new Set(ROOMS.map(room=>room.id)).size,5);
  assert.ok(WALLS.length>=9);
});

test("every window faces the same external light direction",()=>{
  assert.equal(WINDOWS.length,3);for(const window of WINDOWS){assert.ok(window.from>=0);assert.ok(window.to<=ROOM.width);assert.ok(window.to>window.from);}
});
