import test from "node:test";
import assert from "node:assert/strict";
import { Throwables } from "../src/throwables.ts";
import { Clicker } from "../src/clicker.ts";
import { createGame } from "../src/game.ts";

test("pickup transfers one nearby object into one hand without duplication", () => {
  const objects = new Throwables(),
    stone = objects.snapshot()[0],
    player = { x: 1.9, y: 1.55 };
  assert.equal(objects.pickUp(stone.id, { x: 8, y: 8 }), false);
  assert.equal(objects.pickUp(stone.id, player), true);
  assert.equal(objects.pickUp(stone.id, player), false);
  assert.equal(objects.pickUp(objects.snapshot()[1].id, player), false);
  assert.equal(objects.snapshot().filter((i) => i.state === "held").length, 1);
  assert.equal(objects.snapshot().length, 7);
});
test("longer hold produces a more powerful throw and cancellation retains the object", () => {
  const short = new Throwables(),
    long = new Throwables(),
    player = { x: 1.9, y: 1.55 };
  for (const items of [short, long]) {
    items.pickUp(items.snapshot()[0].id, player);
    items.beginCharge();
  }
  short.update(0.1, player);
  long.update(1.2, player);
  short.release(player, 0);
  long.release(player, 0);
  assert.ok(long.snapshot()[0].vx > short.snapshot()[0].vx);
  const cancelled = new Throwables();
  cancelled.pickUp(cancelled.snapshot()[0].id, player);
  cancelled.beginCharge();
  cancelled.cancelCharge();
  assert.equal(cancelled.release(player, 0), false);
  assert.ok(cancelled.held());
});
test("a stone bounces, makes sound, and can be picked up again", () => {
  const objects = new Throwables(),
    player = { x: 1.9, y: 1.55 };
  objects.pickUp(objects.snapshot()[0].id, player);
  objects.beginCharge();
  objects.update(0.5, player);
  objects.release(player, Math.PI / 2);
  const sounds = [];
  for (let i = 0; i < 300; i++) sounds.push(...objects.update(1 / 60, player));
  const stone = objects.snapshot()[0];
  assert.equal(stone.state, "ground");
  assert.ok(stone.impacts >= 2);
  assert.ok(sounds.length >= 2);
  assert.equal(objects.pickUp(stone.id, stone), true);
});
test("two bottles break on impact, emit distraction sound, and cannot be reused", () => {
  const objects = new Throwables(),
    bottles = objects.snapshot().filter((i) => i.kind === "bottle");
  assert.equal(bottles.length, 2);
  const bottle = bottles[0],
    player = { x: bottle.x, y: bottle.y };
  objects.pickUp(bottle.id, player);
  objects.beginCharge();
  objects.update(0.6, player);
  objects.release(player, 0);
  const sounds = [];
  for (let i = 0; i < 240; i++) sounds.push(...objects.update(1 / 60, player));
  assert.equal(
    objects.snapshot().find((i) => i.id === bottle.id)!.state,
    "broken",
  );
  assert.equal(objects.pickUp(bottle.id, player), false);
  assert.ok(sounds.some((s) => s.source === "bottle" && s.loudness! > 1));
});
test("stationary stealth emits no sound while a clicker finishes searching and leaves", () => {
  const game = createGame();
  for (let i = 0; i < 300; i++) game.update(1 / 60, 0, 0, true);
  assert.deepEqual(game.takeFootsteps(), []);
  const clicker = new Clicker(),
    start = clicker.snapshot();
  clicker.hear({ ...start, source: "player" });
  for (let i = 0; i < 600; i++) clicker.update(1 / 60);
  assert.equal(clicker.snapshot().mode, "wandering");
  assert.equal(clicker.snapshot().lastHeard, null);
  assert.ok(
    Math.hypot(clicker.snapshot().x - start.x, clicker.snapshot().y - start.y) >
      0.8,
  );
});
