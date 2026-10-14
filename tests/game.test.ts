import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../src/game.ts";

test("the player moves horizontally and can jump",()=>{
  const game=createGame(),start=game.player();game.update(.04,1,-1,false);
  assert.ok(game.player().x>start.x);assert.ok(game.player().y>start.y);
  assert.equal(game.player().grounded,false);
});
test("the player remains inside the room",()=>{
  const game=createGame();for(let i=0;i<500;i++)game.update(.04,-1,-1,true);
  assert.ok(game.player().x>=.179&&game.player().y>=0);
  for(let i=0;i<1000;i++)game.update(.04,1,1,true);
  assert.ok(game.player().x<=game.room.width-.179&&game.player().y<=game.room.height-.249);
});
test("the younger brother follows at a short distance",()=>{
  const game=createGame();for(let i=0;i<140;i++)game.update(1/60,1,0,false);
  const p=game.player(),b=game.brother(),gap=Math.hypot(p.x-b.x,p.y-b.y);
  assert.ok(gap>=.46&&gap<.56,`unexpected gap ${gap}`);
});

test("stealth is slower than walking and affects both brothers",()=>{
  const walking=createGame(),stealth=createGame(),start=walking.player();
  walking.update(.04,1,0,false);stealth.update(.04,1,0,true);
  const walkDistance=Math.hypot(walking.player().x-start.x,walking.player().y-start.y);
  const stealthDistance=Math.hypot(stealth.player().x-start.x,stealth.player().y-start.y);
  assert.ok(stealthDistance<walkDistance);
  assert.equal(stealth.player().stealth,true);
  assert.equal(stealth.brother().stealth,true);
});
