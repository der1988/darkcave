import test from "node:test";
import assert from "node:assert/strict";
import { objectShadow } from "../src/prop-renderer.ts";
import type { RoomProp } from "../src/room-props.ts";

const prop: RoomProp = {
  minX: 2, minY: 2, maxX: 2.34, maxY: 2.34,
  height: .34, color: [80, 70, 60],
};

test("the cube shadow extends away from the flashlight", () => {
  const fromLeft = objectShadow(prop, { x: 0, y: 2.5 });
  const fromRight = objectShadow(prop, { x: 5, y: 2.5 });
  assert.ok(Math.max(...fromLeft.map(point=>point[0]))>prop.maxX);
  assert.ok(Math.min(...fromRight.map(point=>point[0]))<prop.minX);
  assert.notDeepEqual(fromLeft,fromRight);
});

test("the object has equal width, depth and height", () => {
  const width=prop.maxX-prop.minX,depth=prop.maxY-prop.minY;
  assert.ok(Math.abs(width-depth)<1e-9);
  assert.ok(Math.abs(width-prop.height)<1e-9);
});

test("the hard shadow starts on exact footprint corners", () => {
  const shadow = objectShadow(prop, { x: 0, y: 2.5 });
  const corners = new Set(["2,2", "2.34,2", "2.34,2.34", "2,2.34"]);
  assert.ok(corners.has(`${shadow[0][0]},${shadow[0][1]}`));
  assert.ok(corners.has(`${shadow[1][0]},${shadow[1][1]}`));
});
