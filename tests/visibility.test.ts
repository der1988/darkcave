import { ROOM_SCALE } from "../src/room.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { actorOpacity } from "../src/actor-renderer.ts";
import { visible } from "../src/lighting.ts";

test("brothers fade behind solid walls but remain opaque in openings", () => {
  assert.equal(actorOpacityScaled({ x: 2.7, y: 0.3 }), 0.48);
  assert.equal(actorOpacityScaled({ x: 2.7, y: 7.2 }), 1);
  assert.equal(actorOpacityScaled({ x: 1, y: 2.5 }), 1);
  assert.equal(actorOpacityScaled({ x: 0.3, y: 2.5 }), 0.48);
});
test("horizontal partitions block light except at doors", () => {
  assert.equal(
    visible({ x: 0.5, y: 3, z: 0.4 }, { x: 0.5, y: 4, z: 0.4 }),
    false,
  );
  assert.equal(
    visible({ x: 1.8, y: 3, z: 0.4 }, { x: 1.8, y: 4, z: 0.4 }),
    true,
  );
});

function actorOpacityScaled(p: { x: number; y: number }) {
  return actorOpacity({ x: p.x * ROOM_SCALE, y: p.y * ROOM_SCALE });
}
