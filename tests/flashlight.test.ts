import test from "node:test";
import assert from "node:assert/strict";
import { Flashlight } from "../src/flashlight.ts";

test("the flashlight creates a circular spot and fades at its edge", () => {
  const flashlight = new Flashlight();
  const origin = { x: 4, y: 3 };
  const center = flashlight.target(origin);
  const radius = flashlight.spotRadius();
  assert.ok(flashlight.at(center, origin) > flashlight.at({ x: center.x + radius * 0.7, y: center.y }, origin));
  assert.equal(flashlight.at({ x: center.x + radius, y: center.y }, origin), 0);
});

test("the flashlight spot stops at the first room wall", () => {
  const flashlight = new Flashlight();
  flashlight.angle = 0;
  flashlight.range = 20;
  assert.deepEqual(flashlight.target({ x: 4, y: 3 }, { width: 8, height: 6 }), { x: 8, y: 3 });
});
