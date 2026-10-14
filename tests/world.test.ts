import test from "node:test";
import assert from "node:assert/strict";
import { HOUSE,LADDERS,PLATFORMS,ROOMS } from "../src/house-world.ts";

test("the house contains twelve rooms across three levels",()=>{
  assert.equal(ROOMS.length,12);assert.equal(new Set(ROOMS.map(room=>room.id)).size,12);
  assert.equal(HOUSE.roomWidth,4);assert.equal(HOUSE.floorHeight,2.8);
});

test("platform gaps align with the two vertical connections",()=>{
  assert.equal(LADDERS.length,2);assert.equal(PLATFORMS.length,5);
  for(const ladder of LADDERS)assert.ok(!PLATFORMS.some(platform=>platform.y===ladder.toY&&ladder.x>=platform.from&&ladder.x<=platform.to));
});
