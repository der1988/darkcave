import test from "node:test";
import assert from "node:assert/strict";
import { CUBES,ROOM_HEIGHT,ROOM_WIDTH,WORLD,ZONES } from "../src/world.ts";

test("the world contains three half-size rooms",()=>{
  assert.equal(ZONES.length,3);
  assert.equal(ROOM_WIDTH,4);
  assert.equal(ROOM_HEIGHT,3);
  assert.deepEqual(WORLD,{width:12,height:3});
});

test("each lighting zone contains one cube",()=>{
  assert.equal(CUBES.length,3);
  for(const zone of ZONES)
    assert.equal(CUBES.filter(cube=>(cube.minX+cube.maxX)/2>=zone.minX&&
      (cube.minX+cube.maxX)/2<zone.maxX).length,1);
});
