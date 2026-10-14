import test from "node:test";
import assert from "node:assert/strict";
import { CUBES,ROOM_HEIGHT,ROOM_WIDTH,WORLD,ZONES } from "../src/world.ts";

test("the world contains eight half-size rooms in a square loop",()=>{
  assert.equal(ZONES.length,8);
  assert.equal(ROOM_WIDTH,4);
  assert.equal(ROOM_HEIGHT,3);
  assert.deepEqual(WORLD,{width:12,height:9});
});

test("each lighting zone contains one cube",()=>{
  assert.equal(CUBES.length,8);
  for(const zone of ZONES)
    assert.equal(CUBES.filter(cube=>{const x=(cube.minX+cube.maxX)/2,y=(cube.minY+cube.maxY)/2;
      return x>=zone.minX&&x<zone.maxX&&y>=zone.minY&&y<zone.maxY;}).length,1);
});
