import test from "node:test";
import assert from "node:assert/strict";
import { wallOpacity } from "../src/actor-renderer.ts";

const actor=(x:number,y:number)=>({x,y,heading:0,stride:0,moving:false,stealth:false});

test("a brother fades behind a solid partition but not inside its doorway",()=>{
  assert.ok(wallOpacity(actor(3.6,.6))<1);
  assert.equal(wallOpacity(actor(3.6,1.5)),1);
});
