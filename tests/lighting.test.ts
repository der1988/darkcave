import test from "node:test";
import assert from "node:assert/strict";
import { Flashlight, sunlight, visible } from "../src/lighting.ts";

test("walls block light but doorways transmit it", () => {
  assert.equal(
    visible({ x: 2, y: 0.5, z: 0.4 }, { x: 4, y: 0.5, z: 0.4 }),
    false,
  );
  assert.equal(
    visible({ x: 2, y: 1.5, z: 0.4 }, { x: 4, y: 1.5, z: 0.4 }),
    true,
  );
});
test("sunlight reaches only floor points projected through windows", () => {
  assert.ok(sunlight({ x: 1.06, y: 1, z: 0 }) > 0.5);
  assert.equal(sunlight({ x: 2, y: 1, z: 0 }), 0);
});
test("torch illuminates walls, fades with distance, and stops behind walls", () => {
  const torch = new Flashlight();
  torch.angle = 0;
  const actor = { x: 1, y: 0.5 };
  assert.ok(torch.at({ x: 3.2, y: 0.5, z: 0.43 }, actor) > 0);
  assert.equal(torch.at({ x: 4, y: 0.5, z: 0.43 }, actor), 0);
  assert.ok(
    torch.at({ x: 1.8, y: 0.5, z: 0.4 }, actor) >
      torch.at({ x: 2.8, y: 0.5, z: 0.4 }, actor),
  );
  torch.toggle();
  assert.equal(torch.at({ x: 2, y: 0.5, z: 0.4 }, actor), 0);
});
