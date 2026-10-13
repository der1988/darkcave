import { test } from "node:test";
import assert from "node:assert/strict";
import { Creature } from "../src/creature.ts";
import { Heart, Capture } from "../src/heart.ts";
import { beam, surfaceLight, type Point } from "../src/light.ts";
import { pathfind } from "../src/navigation.ts";
import { canStand, visible } from "../src/world.ts";
const tick = (
  c: Creature,
  seconds: number,
  observation: Point | null = null,
) => {
  for (let i = 0; i < seconds * 60; i++) c.update(1 / 60, observation);
};
function random(seed = 142) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test("light off, outside cone, behind column: no exposure; same clear beam exposes creature", () => {
  const lamp = { x: 48.5, y: 49.5, angle: 0, on: true };
  assert.equal(beam(lamp, 50.5, 49.5), 0);
  assert.equal(beam({ ...lamp, on: false }, 48.8, 49.5), 0);
  assert.equal(beam(lamp, 47.5, 49.5), 0);
  assert.ok(beam(lamp, 48.8, 49.5) > 0.5);
  const adapted = surfaceLight({ ...lamp, on: false }, 48.6, 49.5, 0);
  assert.ok(adapted > 0.015 && adapted < 0.04);
  assert.equal(surfaceLight({ ...lamp, on: false }, 50.5, 49.5, 0), 0);
  assert.equal(surfaceLight({ ...lamp, on: false }, 40.5, 49.5, 0), 0);
});
test("wandering is independent and remains in navigable geometry over a long patrol", () => {
  const c = new Creature(random());
  const start = { ...c.position };
  for (let i = 0; i < 180 * 30; i++) {
    c.update(1 / 30, null);
    assert.ok(canStand(c.position.x, c.position.y));
    assert.equal(c.lastKnown, null);
    assert.equal(c.state, "wandering");
  }
  assert.ok(Math.hypot(start.x - c.position.x, start.y - c.position.y) > 1);
});
test("exposure causes reaction, then accelerated pursuit, not teleportation", () => {
  const c = new Creature(random());
  c.position = { x: 53.5, y: 49.5 };
  c.update(1 / 60, { x: 53.5, y: 53.5 });
  assert.equal(c.state, "reacting");
  tick(c, 1, { x: 53.5, y: 53.5 });
  assert.equal(c.state, "pursuing");
  assert.ok(c.position.y > 49.5 && c.position.y < 51);
  tick(c, 1, { x: 53.5, y: 56.5 });
  assert.ok(c.speed > 1.65 && c.speed < 2.1);
});
test("dark escape freezes last known position, searches, and forgets after timeout", () => {
  const c = new Creature(random());
  c.position = { x: 53.5, y: 49.5 };
  const observed = { x: 53.5, y: 53.5 };
  tick(c, 0.8, observed);
  c.update(1 / 60, null);
  assert.equal(c.state, "remembering");
  // Mutating the original observation cannot secretly move the remembered target.
  observed.x = 57.5;
  observed.y = 58.5;
  assert.deepEqual(c.lastKnown, { x: 53.5, y: 53.5 });
  let searched = false,
    returned = false;
  for (let i = 0; i < 30 * 60; i++) {
    c.update(1 / 60, null);
    assert.ok(canStand(c.position.x, c.position.y));
    if (String(c.state) === "searching") searched = true;
    if (searched && String(c.state) === "wandering") {
      returned = true;
      break;
    }
  }
  assert.ok(searched && returned);
  assert.equal(c.lastKnown, null);
});
test("pathfinding routes around columns and across rooms without corner cutting", () => {
  const route = pathfind({ x: 48.5, y: 49.5 }, { x: 50.5, y: 49.5 });
  assert.ok(route.length > 3);
  for (let i = 0; i < route.length; i++) {
    assert.ok(canStand(route[i].x, route[i].y));
    if (i)
      assert.ok(
        visible(route[i - 1].x, route[i - 1].y, route[i].x, route[i].y),
      );
  }
  const c = new Creature(random());
  c.position = { x: 48.5, y: 49.5 };
  tick(c, 0.7, { x: 50.5, y: 49.5 });
  for (let i = 0; i < 5 * 60; i++) {
    c.update(1 / 60, null);
    assert.ok(canStand(c.position.x, c.position.y));
  }
  assert.ok(Math.hypot(c.position.x - 50.5, c.position.y - 49.5) < 1);
  assert.ok(pathfind({ x: 53.5, y: 53.5 }, { x: 88.5, y: 80.5 }).length > 30);
});
test("heart stays calm without perceived stimuli; audible and visible fear rise smoothly then recover", () => {
  const h = new Heart();
  for (let i = 0; i < 60 * 10; i++) {
    h.perceive(false, false, 0);
    h.update(1 / 60);
  }
  assert.equal(h.bpm, 70);
  assert.ok(h.beats >= 11 && h.beats <= 12);
  h.perceive(false, false, 0.8);
  h.update(1 / 60);
  assert.ok(h.bpm > 70 && h.bpm < 71);
  for (let i = 0; i < 60 * 4; i++) {
    h.perceive(false, false, 0.8);
    h.update(1 / 60);
  }
  assert.ok(h.bpm > 100 && h.bpm < 120);
  for (let i = 0; i < 60 * 5; i++) {
    h.perceive(true, true, 0);
    h.update(1 / 60);
  }
  assert.ok(h.bpm > 140 && h.bpm < 160);
  for (let i = 0; i < 60 * 65; i++) {
    h.perceive(false, false, 0);
    h.update(1 / 60);
  }
  assert.ok(h.bpm < 72);
});
test("heartbeat waveform comes from the simulated beat event and phase", () => {
  const h = new Heart();
  let beat = false;
  for (let i = 0; i < 60 && !beat; i++) beat = h.update(1 / 60);
  assert.ok(beat);
  assert.ok(h.beatAge < 0.017);
  assert.equal(h.beats, 1);
  h.update(0.03);
  assert.ok(h.waveform() > 0.5);
  h.update(0.35);
  assert.ok(Math.abs(h.waveform()) < 0.01);
});
test("capture requires attacking physical contact; hidden passersby are safe; fade resets", () => {
  const c = new Creature(random()),
    p = { ...c.position };
  assert.equal(c.canCapture(p), false);
  c.state = "searching";
  assert.equal(c.canCapture(p), false);
  c.state = "pursuing";
  assert.equal(c.canCapture(p), true);
  assert.equal(c.canCapture({ x: p.x + 1, y: p.y }), false);
  const failure = new Capture();
  failure.start();
  assert.equal(failure.update(0.3), false);
  assert.ok(failure.opacity > 0 && failure.opacity < 1);
  failure.update(0.5);
  assert.equal(failure.silent, true);
  assert.equal(failure.opacity, 1);
  assert.equal(failure.update(1.7), true);
});

test("spatial sound weakens with distance, pans by projection, and filters through walls", async () => {
  const { acoustics } = await import("../src/audio.ts");
  const p = { x: 53.5, y: 53.5 };
  const near = acoustics(p, { x: 54.5, y: 53.5 }),
    far = acoustics(p, { x: 57.5, y: 53.5 });
  assert.ok(near.gain > far.gain);
  assert.ok(near.pan > 0);
  assert.ok(acoustics(p, { x: 52.5, y: 53.5 }).pan < 0);
  const blocked = acoustics({ x: 48.5, y: 49.5 }, { x: 50.5, y: 49.5 });
  assert.equal(blocked.cutoff, 230);
  assert.ok(blocked.gain < near.gain * 0.3);
  assert.equal(acoustics(p, { x: 90.5, y: 53.5 }).gain, 0);
});
test("weaker continuing sounds cannot indefinitely preserve pursuit-level fear", () => {
  const h = new Heart();
  for (let i = 0; i < 600; i++) {
    h.perceive(true, true, 0);
    h.update(1 / 60);
  }
  for (let i = 0; i < 3600; i++) {
    h.perceive(false, false, 0.2);
    h.update(1 / 60);
  }
  assert.ok(h.bpm < 100 && h.bpm > 85);
});
