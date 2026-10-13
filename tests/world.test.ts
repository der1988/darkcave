import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, tiles, spawn, solid, visible, canStand, move, project, screenToWorld } from '../src/world.ts';

test('every authored floor cell is reachable from arrival', () => {
  const queue = [[Math.floor(spawn.x), Math.floor(spawn.y)]];
  const seen = new Set<number>();
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    const key = y * SIZE + x;
    if (solid(x,y) || seen.has(key)) continue;
    seen.add(key);
    queue.push([x-1,y],[x+1,y],[x,y-1],[x,y+1]);
  }
  assert.equal(seen.size, [...tiles].filter((v,i)=>v && !solid(i%SIZE,Math.floor(i/SIZE))).length);
  assert.ok(seen.size > 2000);
});
test('flashlight reaches open floors and stops at structural columns and walls', () => {
  assert.equal(visible(53.5,53.5,57.5,53.5),true);
  assert.equal(visible(48.5,49.5,50.5,49.5),false);
  assert.equal(visible(53.5,53.5,53.5,20.5),false);
  assert.equal(visible(48.5,48.5,50.5,50.5),false);
  assert.equal(visible(53.5,53.5,49.5,49.5),false);
});
test('movement cannot tunnel into walls, including a large frame step', () => {
  const p = {x:46.5,y:53.5};
  move(p,-100,0);
  assert.ok(canStand(p.x,p.y));
  assert.ok(p.x >= 12);
  const column = {x:48.5,y:49.5};
  move(column,5,0);
  assert.ok(column.x < 49);
  assert.ok(canStand(column.x,column.y));
});
test('projection round-trips and screen-up movement travels upward', () => {
  for (const [x,y] of [[1,0],[0,1],[-2,5]]) {
    const p = project(x,y); const q = screenToWorld(p.x,p.y);
    assert.equal(q.x,x); assert.equal(q.y,y);
  }
  const up=screenToWorld(0,-1);
  assert.ok(up.x<0 && up.y<0);
});
