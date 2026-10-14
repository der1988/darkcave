import test from "node:test";
import assert from "node:assert/strict";
import { ROOM, ROOMS, WALLS } from "../src/room.ts";

test("the house contains three directly connected liminal rooms", () => {
  assert.deepEqual(ROOM, { width: 9.6, height: 3, wallHeight: 1.4 });
  assert.equal(ROOMS.length, 3);
  assert.equal(new Set(ROOMS.map((room) => room.id)).size, 3);
  assert.equal(
    ROOMS.some((room) => room.id === "hall"),
    false,
  );
  assert.ok(WALLS.length === 4);
});
