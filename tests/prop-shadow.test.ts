import test from "node:test";
import assert from "node:assert/strict";
import { objectShadow } from "../src/prop-renderer.ts";
import type { RoomProp } from "../src/room-props.ts";

const prop: RoomProp = {
  minX: 2, minY: 2, maxX: 2.34, maxY: 2.34,
  height: .34, color: [80, 70, 60],
};

test("object shadows move to the opposite side of the flashlight", () => {
  const fromLeft = objectShadow(prop, { x: 0, y: 2.5 });
  const fromRight = objectShadow(prop, { x: 5, y: 2.5 });
  assert.ok(Math.max(...fromLeft.map(p=>p[0])) > prop.maxX);
  assert.ok(Math.min(...fromRight.map(p=>p[0])) < prop.minX);
  assert.notDeepEqual(fromLeft, fromRight);
});

test("a flatter light angle produces a longer perspective shadow", () => {
  const near = objectShadow(prop, { x: 1.8, y: 2.5 });
  const far = objectShadow(prop, { x: -5, y: 2.5 });
  const span=(points:[number,number,number][])=>Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]));
  assert.ok(span(far)>span(near));
});

test("the hard shadow starts on exact footprint corners", () => {
  const shadow = objectShadow(prop, { x: 0, y: 2.5 });
  const corners = new Set(["2,2", "2.34,2", "2.34,2.34", "2,2.34"]);
  assert.ok(shadow.some(p=>corners.has(`${p[0]},${p[1]}`)));
});
