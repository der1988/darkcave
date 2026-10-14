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

test("solid occluders stop light and points behind them stay dark", () => {
  const flashlight = new Flashlight();
  flashlight.angle = 0;
  flashlight.range = 8;
  flashlight.setOccluders([{ minX: 5, minY: 2.5, maxX: 5.4, maxY: 3.5 }]);
  const origin = { x: 2, y: 3 };
  assert.ok(flashlight.effectiveRange(origin) <= 3.001);
  assert.equal(flashlight.reaches({ x: 6, y: 3 }, origin), false);
});

test("aim follows its target with smooth inertia", () => {
  const flashlight = new Flashlight();
  const start = flashlight.angle;
  flashlight.aim({ x: 4, y: 0 });
  flashlight.update(1 / 60, { stride: 0, moving: false }, false, 0);
  assert.ok(flashlight.angle > start && flashlight.angle < 0);
});
