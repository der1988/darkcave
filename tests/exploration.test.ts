import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Exploration } from "../src/exploration.ts";
import {
  LIT_ROOMS,
  FURNITURE,
  isSafe,
  roomLight,
  furnitureSolid,
} from "../src/environments.ts";
import {
  spawn,
  SIZE,
  canStand,
  move,
  setObstacles,
  visible,
} from "../src/world.ts";
import { pathfind } from "../src/navigation.ts";
import { Creature } from "../src/creature.ts";
import { beam, surfaceLight } from "../src/light.ts";
import { Possessions } from "../src/possessions.ts";
afterEach(() => setObstacles([]));

test("exploration records nearby sightlines, hides remote rooms and retains visited space", () => {
  const map = new Exploration();
  assert.equal(map.cells.size, 0);
  map.visit(spawn);
  assert.ok(map.cells.size > 10);
  assert.equal(map.cells.has(30 * SIZE + 20), false);
  for (const id of map.cells)
    assert.ok(
      visible(spawn.x, spawn.y, (id % SIZE) + 0.5, Math.floor(id / SIZE) + 0.5),
    );
  const initial = [...map.cells];
  map.visit({ x: 20.5, y: 33.5 });
  assert.ok(map.cells.size > initial.length);
  initial.forEach((id) => assert.ok(map.cells.has(id)));
  assert.ok(map.cells.has(33 * SIZE + 20));
  assert.equal(
    map.cells.has(8 * SIZE + 20),
    false,
    "A visit to the mall must not discover the playground",
  );
});
test("all new stages remain reachable; furniture shares collision and sightlines", () => {
  for (const p of [
    { x: 41.5, y: 46.5 },
    { x: 20.5, y: 33.5 },
    { x: 23.5, y: 12.5 },
  ])
    assert.ok(pathfind(spawn, p).length);
  for (const f of FURNITURE.filter((f) => f.collision !== false)) {
    assert.equal(canStand(f.x + 0.5, f.y + 0.5), false);
    assert.ok(furnitureSolid(f.x, f.y));
  }
  const p = { x: 12.5, y: 26.5 };
  move(p, 2, 0);
  assert.ok(p.x < 13);
  assert.ok(canStand(p.x, p.y));
});
test("fixed light remains visible with torch off and never adds creature exposure", () => {
  for (const r of LIT_ROOMS.filter((r) => r.safe)) {
    const p = { x: r.x + 2.5, y: r.y + 2.5 },
      lamp = { ...p, angle: 0, on: false };
    assert.ok(roomLight(p.x, p.y) > 0.2);
    assert.ok(surfaceLight(lamp, p.x, p.y, 0) > 0.2);
    assert.equal(beam(lamp, p.x + 0.1, p.y), 0);
  }
  assert.equal(roomLight(53.5, 43.5), 0);
  const state = new Possessions();
  assert.ok(
    state.exposure(
      { x: 20.5, y: 33.5 },
      { x: 20.5, y: 34, angle: 0, on: false },
      false,
    ) > 0.1,
  );
});
test("creature routes, pursuit, search and physical movement cannot enter lit rooms", () => {
  const outside = { x: 44.5, y: 48.5 },
    inside = { x: 41.5, y: 48.5 };
  assert.ok(pathfind(outside, inside).length);
  assert.equal(pathfind(outside, inside, isSafe).length, 0);
  const c = new Creature(() => 0.48);
  c.position = { ...outside };
  for (let i = 0; i < 25; i++) c.update(1 / 30, { x: 43.5, y: 48.5 });
  assert.equal(c.state, "pursuing");
  const remembered = { ...c.lastKnown };
  for (let i = 0; i < 6000; i++) {
    c.update(1 / 30, inside);
    assert.equal(isSafe(c.position.x, c.position.y), false);
    assert.equal(c.canCapture(inside), false);
    if (i === 0) assert.deepEqual(c.lastKnown, remembered);
  }
  assert.equal(c.lastKnown, null);
  const p = { ...outside };
  move(p, -6, 0, isSafe);
  assert.ok(p.x >= 42.19);
});
test("map progress survives save and reload; v1 saves migrate without changing ownership", () => {
  const state = new Possessions();
  state.sync();
  state.exploration.visit(spawn);
  assert.equal(state.take("key-01", spawn), "");
  const encoded = state.encode(spawn, false);
  const loaded = new Possessions();
  assert.ok(loaded.load(JSON.stringify(encoded)));
  assert.deepEqual(loaded.encode(spawn, false), encoded);
  const legacy = {
    ...encoded,
    version: 1,
    explored: undefined,
    items: encoded.items.filter(
      (i) => !i.id.startsWith("memory-") && !i.id.startsWith("f-"),
    ),
  };
  const migrated = new Possessions();
  assert.ok(migrated.load(JSON.stringify(legacy)));
  for (const item of encoded.items)
    assert.deepEqual(migrated.item(item.id), item);
  assert.equal(migrated.exploration.cells.size, 0);
  assert.equal(migrated.encode(spawn, false).version, 4);
  const before = [...loaded.exploration.cells];
  assert.equal(
    loaded.load(
      JSON.stringify({
        ...encoded,
        maps: {
          ...encoded.maps,
          surface: { floor: [-1], walls: [], blocked: [] },
        },
      }),
    ),
    null,
  );
  assert.deepEqual([...loaded.exploration.cells], before);
});

test("legacy floor objects displaced by new furniture retain their unique ownership", () => {
  const state = new Possessions();
  state.sync();
  const save = state.encode(spawn, true);
  save.version = 1;
  const count = save.items.length;
  save.items = save.items.filter(
    (i) => !i.id.startsWith("memory-") && !i.id.startsWith("f-"),
  );
  delete save.explored;
  const key = save.items.find((i) => i.id === "key-01")!;
  key.location = { kind: "world", position: { x: 22.5, y: 32.5 } };
  const migrated = new Possessions();
  assert.ok(migrated.load(JSON.stringify(save)));
  const item = migrated.item("key-01")!;
  assert.equal(item.location.kind, "world");
  if (item.location.kind === "world") {
    assert.ok(canStand(item.location.position.x, item.location.position.y));
    assert.ok(
      Math.hypot(
        item.location.position.x - 22.5,
        item.location.position.y - 32.5,
      ) < 3,
    );
  }
  assert.equal(migrated.items.length, count);
  assert.equal(new Set(migrated.items.map((i) => i.id)).size, count);
});
