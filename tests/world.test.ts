import {
  ROOM_SCALE,
  COMPUTER,
  MEMORY,
  EXIT,
  MEMORY_GATE,
} from "../src/room.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { ROOM, ROOMS, DOORS, CLICKER_SPAWNS, roomAt } from "../src/room.ts";
import { findPath } from "../src/navigation.ts";
import { blocked } from "../src/movement.ts";
import { visible } from "../src/lighting.ts";
import { createGame, type Game } from "../src/game.ts";
import type { Point } from "../src/geometry.ts";

test("the sketch has two six-room wings, a central memory bridge and seven clickers", () => {
  assert.deepEqual(ROOM, { width: 18, height: 10.8, wallHeight: 1.4 });
  assert.equal(ROOMS.length, 13);
  assert.equal(CLICKER_SPAWNS.length, 7);
  assert.equal(DOORS.length, 12);
  assert.equal(roomAt(7.5 * ROOM_SCALE, 1.5 * ROOM_SCALE), undefined);
  assert.equal(roomAt(7.5 * ROOM_SCALE, 7.5 * ROOM_SCALE), undefined);
  assert.equal(roomAt(MEMORY.x, MEMORY.y)?.id, "memory");
  for (const spawn of CLICKER_SPAWNS)
    assert.equal(blocked(spawn.x, spawn.y), false);
});
test("the memory gate blocks movement, sound paths and light until unlocked", () => {
  const left = { x: MEMORY_GATE.position - 0.3, y: MEMORY.y },
    right = { x: MEMORY_GATE.position + 0.3, y: MEMORY.y };
  assert.equal(blocked(MEMORY_GATE.position, MEMORY.y), true);
  assert.equal(blocked(MEMORY_GATE.position, MEMORY.y, true), false);
  assert.equal(findPath(left, right).length, 0);
  assert.ok(findPath(left, right, true).length > 0);
  assert.equal(visible({ ...left, z: 0.4 }, { ...right, z: 0.4 }), false);
  assert.equal(visible({ ...left, z: 0.4 }, { ...right, z: 0.4 }, true), true);
});
function go(game: Game, target: Point) {
  const path = findPath(game.player(), target, game.progress().doorOpen);
  assert.ok(path.length > 0);
  for (const point of path) {
    for (let i = 0; i < 90; i++) {
      const player = game.player(),
        dx = point.x - player.x,
        dy = point.y - player.y;
      if (Math.hypot(dx, dy) < 0.045) break;
      game.update(1 / 60, (dx - dy) / 2, (dx + dy) / 2, true);
    }
  }
  assert.ok(
    Math.hypot(game.player().x - target.x, game.player().y - target.y) < 0.25,
  );
}
test("playable route: reach computer, unlock bridge, collect memory, enter right wing and exit", () => {
  const game = createGame();
  assert.equal(game.interact(), false);
  go(game, { x: COMPUTER.x, y: COMPUTER.y + 0.7 });
  assert.equal(game.interact(), true);
  assert.equal(game.progress().doorOpen, true);
  go(game, MEMORY);
  assert.equal(game.interact(), true);
  assert.equal(game.progress().memoryCollected, true);
  go(game, { x: 10.8 * ROOM_SCALE, y: 4.5 * ROOM_SCALE });
  assert.equal(roomAt(game.player().x, game.player().y)?.id, "right-middle");
  for (let i = 0; i < 240; i++) game.update(1 / 60, 0, 0, true);
  assert.equal(roomAt(game.brother().x, game.brother().y)?.id, "right-middle");
  go(game, { x: EXIT.x, y: EXIT.y + 0.65 });
  assert.equal(game.interact(), true);
  assert.equal(game.progress().finished, true);
});
