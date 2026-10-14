import test from "node:test";
import assert from "node:assert/strict";
import { Clicker } from "../src/clicker.ts";
import { createGame } from "../src/game.ts";
import { Dialogue } from "../src/dialogue.ts";
import { blocked } from "../src/movement.ts";

test("clicker ignores distant sounds and investigates the last nearby footstep", () => {
  const clicker = new Clicker();
  assert.equal(clicker.hear({ x: 1, y: 1, source: "player" }), false);
  assert.equal(clicker.hear({ x: 13, y: 6.4, source: "brother" }), true);
  const start = clicker.snapshot();
  for (let i = 0; i < 60; i++) clicker.update(1 / 60);
  const state = clicker.snapshot();
  assert.equal(state.mode, "investigating");
  assert.deepEqual(state.lastHeard, { x: 13, y: 6.4 });
  assert.notEqual(state.y, start.y);
  assert.equal(blocked(state.x, state.y), false);
});
test("clicker searches then resumes wandering without receiving more sound", () => {
  const clicker = new Clicker();
  clicker.hear({ x: 13.5, y: 7.5, source: "player" });
  for (let i = 0; i < 300; i++) clicker.update(1 / 60);
  assert.equal(clicker.snapshot().mode, "wandering");
  assert.equal(clicker.snapshot().lastHeard, null);
});
test("walking generates actual footstep events and stealth remains silent", () => {
  const walking = createGame(),
    stealth = createGame();
  for (let i = 0; i < 50; i++) {
    walking.update(1 / 60, 1, 1, false);
    stealth.update(1 / 60, 1, 1, true);
  }
  assert.ok(walking.takeFootsteps().length > 0);
  assert.deepEqual(stealth.takeFootsteps(), []);
  assert.deepEqual(walking.takeFootsteps(), []);
});
test("dialogue appears, expires, and replies alternate between the brothers", () => {
  const dialogue = new Dialogue();
  dialogue.update(2.1, false);
  assert.equal(dialogue.snapshot()?.speaker, "brother");
  dialogue.update(4, false);
  assert.equal(dialogue.snapshot(), null);
  dialogue.update(1, false);
  assert.equal(dialogue.snapshot()?.speaker, "player");
});
