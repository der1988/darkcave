import { test } from "node:test";
import assert from "node:assert/strict";
import { beam, flashlightPower } from "../src/light.ts";
import { Companion } from "../src/companion.ts";
import { movementSpeed, movementVector } from "../src/movement.ts";
import {
  BROTHER_START,
  PLAYER_START,
  ROOM,
  inside,
  move,
  project,
  screenToWorld,
} from "../src/world.ts";

test("all eight movement directions have equal speed", () => {
  for (const [x, y] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    const p = movementVector(x, y);
    assert.ok(Math.abs(Math.hypot(p.x, p.y) - 1) < 1e-9);
  }
  assert.ok(movementSpeed(true) > movementSpeed(false));
});

test("movement cannot leave the room, even with a large frame", () => {
  const p = { ...PLAYER_START };
  move(p, -100, -100);
  assert.equal(inside(p.x, p.y), true);
  assert.ok(p.x >= ROOM.x && p.y >= ROOM.y);
  move(p, 100, 100);
  assert.equal(inside(p.x, p.y), true);
  assert.ok(p.x <= ROOM.w && p.y <= ROOM.h);
});

test("isometric projection round-trips", () => {
  for (const [x, y] of [
    [1, 0],
    [0, 1],
    [-2, 5],
  ]) {
    const p = project(x, y);
    assert.deepEqual(screenToWorld(p.x, p.y), { x, y });
  }
});

test("the flashlight ends at the cursor-controlled range", () => {
  const lamp = { x: 6, y: 5, angle: 0, range: 3, on: true };
  assert.ok(beam(lamp, { x: 8, y: 5 }) > 0.5);
  assert.equal(beam(lamp, { x: 4, y: 5 }), 0);
  assert.equal(beam({ ...lamp, on: false }, { x: 8, y: 5 }), 0);
  assert.ok(beam(lamp, { x: 8.8, y: 5 }) > 0);
  assert.equal(beam(lamp, { x: 9.01, y: 5 }), 0);
  assert.ok(beam({ ...lamp, range: 5 }, { x: 10, y: 5 }) > 0);
});

test("the flashlight has a bright centre and weakens for distant aiming", () => {
  const near = { x: 6, y: 5, angle: 0, range: 3, on: true };
  const far = { ...near, range: 12 };
  assert.ok(beam(near, { x: 7.5, y: 5 }) > beam(near, { x: 7.3, y: 5.7 }));
  assert.ok(beam(near, { x: 7.5, y: 5 }) > beam(far, { x: 7.5, y: 5 }));
  assert.ok(flashlightPower(2) > flashlightPower(12));
});

test("the younger brother follows closely and is slightly faster", () => {
  const child = new Companion(BROTHER_START);
  const leader = { ...PLAYER_START };
  for (let i = 0; i < 180; i++) {
    move(leader, movementSpeed(false) / 60, 0);
    child.update(1 / 60, leader, false);
  }
  const gap = Math.hypot(
    child.position.x - leader.x,
    child.position.y - leader.y,
  );
  assert.ok(gap >= 0.48 && gap < 0.58, `unexpected gap ${gap}`);
  assert.equal(inside(child.position.x, child.position.y), true);
});
