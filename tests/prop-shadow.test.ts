import test from "node:test";
import assert from "node:assert/strict";
import { objectShadow } from "../src/prop-renderer.ts";
import type { RoomProp } from "../src/room-props.ts";

const prop: RoomProp = {
  id: "test", kind: "box", minX: 2, minY: 2, maxX: 3, maxY: 3,
  height: 1, color: [80, 70, 60], solid: true,
};

test("object shadows move to the opposite side of the flashlight", () => {
  const fromLeft = objectShadow(prop, { x: 0, y: 2.5 });
  const fromRight = objectShadow(prop, { x: 5, y: 2.5 });
  assert.ok(fromLeft[2][0] > 2.5);
  assert.ok(fromRight[2][0] < 2.5);
  assert.notDeepEqual(fromLeft, fromRight);
});

test("nearby light produces a longer object shadow", () => {
  const near = objectShadow(prop, { x: 1.8, y: 2.5 });
  const far = objectShadow(prop, { x: -5, y: 2.5 });
  assert.ok(near[2][0] - 2.5 > far[2][0] - 2.5);
});
