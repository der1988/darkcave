import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../src/game.ts";

test("screen-relative movement is normalized",()=>{
  const horizontal=createGame(),diagonal=createGame(),start=horizontal.player();
  horizontal.update(.04,1,0,false);diagonal.update(.04,1,1,false);
  assert.ok(Math.abs(Math.hypot(horizontal.player().x-start.x,horizontal.player().y-start.y)-
    Math.hypot(diagonal.player().x-start.x,diagonal.player().y-start.y))<.0001);
});
test("the player remains inside the room",()=>{
  const game=createGame();for(let i=0;i<500;i++)game.update(.04,-1,-1,true);
  assert.ok(game.player().x>=.239&&game.player().y>=.239);
  for(let i=0;i<1000;i++)game.update(.04,1,1,true);
  assert.ok(game.player().x<=game.room.width-.239&&game.player().y<=game.room.height-.239);
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
