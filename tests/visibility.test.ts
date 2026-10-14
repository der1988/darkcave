import test from "node:test";
import assert from "node:assert/strict";
import { actorOpacity } from "../src/actor-renderer.ts";
import { visible } from "../src/lighting.ts";

test("brothers fade behind solid walls but remain opaque in openings", () => {
  assert.equal(actorOpacity({ x: 2.7, y: 0.3 }), 0.48);
  assert.equal(actorOpacity({ x: 2.7, y: 7.2 }), 1);
  assert.equal(actorOpacity({ x: 1, y: 2.5 }), 1);
  assert.equal(actorOpacity({ x: 0.3, y: 2.5 }), 0.48);
});
test("horizontal partitions block light except at doors", () => {
  assert.equal(
    visible({ x: 0.5, y: 2, z: 0.4 }, { x: 0.5, y: 3.5, z: 0.4 }),
    false,
  );
  assert.equal(
    visible({ x: 1.6, y: 2, z: 0.4 }, { x: 1.6, y: 3.5, z: 0.4 }),
    true,
  );
});
