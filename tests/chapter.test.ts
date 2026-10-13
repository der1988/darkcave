import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  HOME,
  MEMORY_ROOMS,
  DARK_PASSAGES,
  LEVELS,
  inDarkNetwork,
  inHome,
} from "../src/levels.ts";
import { Possessions } from "../src/possessions.ts";
import { ITEMS } from "../src/items.ts";
import { Companion } from "../src/companion.ts";
import { Creature } from "../src/creature.ts";
import { Inhabitant } from "../src/enemies.ts";
import { SoundEvents } from "../src/sound-events.ts";
import { motionInput } from "../src/movement.ts";
import { Exploration } from "../src/exploration.ts";
import { perceived } from "../src/vision.ts";
import { Dialogue } from "../src/dialogue.ts";
import {
  isSafe,
  pursuerForbidden,
  roomLight,
  homeEquipmentLight,
  ANOMALIES,
} from "../src/environments.ts";
import {
  SIZE,
  move,
  canStand,
  solid,
  setObstacles,
  visible,
} from "../src/world.ts";
import { pathfind } from "../src/navigation.ts";
afterEach(() => {
  setObstacles([]);
  homeEquipmentLight(false);
});
const state = () => {
  const s = new Possessions();
  s.sync();
  return s;
};
function walk(
  p: { x: number; y: number },
  goal: { x: number; y: number },
  child?: Companion,
) {
  const route = pathfind(p, goal);
  assert.ok(route.length, "Destination must be physically connected");
  for (const target of route) {
    let steps = 0;
    while (Math.hypot(target.x - p.x, target.y - p.y) > 0.015) {
      assert.ok(steps++ < 300);
      const dx = target.x - p.x,
        dy = target.y - p.y,
        d = Math.hypot(dx, dy);
      move(
        p,
        (dx / d) * Math.min(d, 1.65 / 30),
        (dy / d) * Math.min(d, 1.65 / 30),
      );
      assert.ok(canStand(p.x, p.y));
      if (child) {
        const before = { ...child.position };
        child.update(1 / 30, p, "walk", true);
        assert.ok(canStand(child.position.x, child.position.y));
        assert.ok(
          Math.hypot(
            child.position.x - before.x,
            child.position.y - before.y,
          ) <=
            2.49 / 30 + 0.001,
        );
      }
    }
  }
  if (child) {
    for (let i = 0; i < 180; i++) child.update(1 / 30, p, "walk", false);
    assert.ok(Math.hypot(child.position.x - p.x, child.position.y - p.y) < 1.1);
  }
}
test("all eight movement directions have equal world speed and CTRL wins over SHIFT", () => {
  for (const [x, y] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    const m = motionInput(x, y, false, false);
    assert.ok(Math.abs(Math.hypot(m.x, m.y) * m.speed - 1.65) < 1e-9);
    const silent = motionInput(x, y, true, true, 0.8);
    assert.equal(silent.gait, "silent");
    assert.equal(silent.speed, 1.65 * 0.4 * 0.8);
  }
});
test("both brothers traverse real rooms, corners and furniture to both memories and home", () => {
  state();
  const p = { ...HOME.spawn },
    child = new Companion(HOME.child);
  for (const goal of [
    { x: 43.5, y: 12.5 },
    HOME.spawn,
    { x: 7.5, y: 49.5 },
    HOME.spawn,
  ])
    walk(p, goal, child);
});
test("child running is slower, silent following generates no ordinary footstep noise", () => {
  const c = new Companion({ x: 42.5, y: 21.5 }),
    p = { x: 43.5, y: 21.5 };
  for (let i = 0; i < 180; i++) {
    move(p, 2.64 / 30, 0);
    c.update(1 / 30, p, "run", true);
  }
  assert.ok(p.x - c.position.x > 1.3);
  const before = { ...c.position };
  c.update(1, p, "silent", true);
  assert.ok(
    Math.hypot(c.position.x - before.x, c.position.y - before.y) <= 0.661,
  );
  assert.equal(c.gait, "silent");
});
test("one connected dark network supports the pursuer while forbidding every main and protected room", () => {
  const origin = { x: 53.5, y: 43.5 };
  for (const r of DARK_PASSAGES)
    assert.ok(
      pathfind(origin, { x: r.x + 0.5, y: r.y + 0.5 }, pursuerForbidden).length,
    );
  for (const p of [
    HOME.spawn,
    { x: 53.5, y: 53.5 },
    { x: 80.5, y: 50.5 },
    { x: 11.5, y: 63.5 },
    ...MEMORY_ROOMS.map((r) => r.person),
  ])
    assert.equal(pathfind(origin, p, pursuerForbidden).length, 0);
  const c = new Creature(() => 0.43, pursuerForbidden);
  for (let i = 0; i < 3000; i++) {
    c.update(1 / 30, null);
    assert.ok(inDarkNetwork(c.position.x, c.position.y));
    assert.equal(isSafe(c.position.x, c.position.y), false);
  }
});
test("clickers are blind, investigate heard positions, and cannot track silently moving brothers", () => {
  const c = new Inhabitant("test", "clicker", { x: 52.5, y: 53.5 }),
    events = new SoundEvents(),
    p = { x: 55.5, y: 53.5 };
  c.update(0.1, [p], { ...p, angle: Math.PI, on: true }, events, 1);
  assert.equal(c.ai.lastKnown, null);
  events.emit("child", p, "step", 1, 11, 2);
  c.update(0.1, [p], { ...p, angle: Math.PI, on: true }, events, 2);
  assert.deepEqual(c.ai.lastKnown, p);
  events.prune(4);
  const memory = structuredClone(c.ai.lastKnown);
  c.update(
    0.1,
    [{ x: 56.5, y: 54.5 }],
    { ...p, angle: 0, on: false },
    events,
    4,
  );
  assert.deepEqual(c.ai.lastKnown, memory);
  const blocked = { x: 48.5, y: 49.5 };
  const sound = new SoundEvents();
  sound.emit("older", { x: 50.5, y: 49.5 }, "step", 0.3, 3.5, 1);
  assert.equal(sound.heard(blocked, 1, 0), undefined);
});
test("zombie vision is directional, occluded, and cannot attack a protected room", () => {
  const e = new Inhabitant("test", "zombie", { x: 53.5, y: 53.5 }),
    events = new SoundEvents();
  e.ai.heading = 0;
  const lamp = { x: 53.5, y: 53.5, angle: 0, on: false };
  e.update(0.1, [{ x: 51.5, y: 53.5 }], lamp, events, 1);
  assert.equal(e.ai.lastKnown, null);
  e.update(0.1, [{ x: 56.5, y: 53.5 }], lamp, events, 2);
  assert.deepEqual(e.ai.lastKnown, { x: 56.5, y: 53.5 });
  e.ai.position = { x: 43.2, y: 47.5 };
  e.ai.state = "pursuing";
  assert.equal(e.ai.canCapture({ x: 42.95, y: 47.5 }), false);
});
test("observed geometry depends on facing, light and walls; separate level memories persist", () => {
  const map = new Exploration(),
    p = { x: 53.5, y: 43.5 },
    lamp = { ...p, angle: 0, on: false };
  map.visit(p, 0, lamp);
  const dim = map.cells.size;
  assert.equal(map.cells.has(43 * SIZE + 58), false);
  map.visit(p, 0, { ...lamp, on: true });
  assert.ok(map.cells.size > dim);
  assert.ok(map.cells.has(43 * SIZE + 58));
  assert.equal(map.cells.has(43 * SIZE + 48), false);
  map.visit(p, Math.PI, { ...lamp, angle: Math.PI, on: true });
  assert.ok(map.cells.has(43 * SIZE + 48));
  const old = map.cells.size;
  map.level = "unknown";
  assert.equal(map.cells.size, 0);
  map.level = "surface";
  assert.equal(map.cells.size, old);
  const load = new Exploration();
  load.loadMaps(map.encode());
  assert.deepEqual(load.encode(), map.encode());
  assert.equal(
    perceived(
      { x: 48.5, y: 49.5 },
      0,
      { x: 48.5, y: 49.5, angle: 0, on: true },
      { x: 50.5, y: 49.5 },
    ),
    false,
  );
});
test("both memories physically return to the archive, unlocking only the registered unavailable layer", () => {
  const s = state(),
    p = { ...HOME.spawn };
  for (const [id, goal] of [
    ["memory-cup", { x: 43.5, y: 12.5 }],
    ["memory-photo", { x: 7.5, y: 49.5 }],
  ] as const) {
    walk(p, goal);
    assert.equal(s.take(id, p), "");
    assert.notEqual(s.take(id, p), "");
    walk(p, { x: 35.5, y: 45.5 });
    assert.equal(s.use(id, "archive", p), "");
    assert.notEqual(s.use(id, "archive", p), "");
  }
  assert.equal(s.complete, true);
  assert.equal(s.delivered.length, 2);
  assert.equal(LEVELS.unknown.implemented, false);
  const loaded = new Possessions();
  assert.ok(loaded.load(JSON.stringify(s.encode(p, false))));
  assert.equal(loaded.complete, true);
  assert.equal(
    new Set(loaded.items.map((i) => i.id)).size,
    loaded.items.length,
  );
});
test("furniture placement protects entrances and actors, storage persists and cannot be carried full", () => {
  const s = state();
  assert.equal(s.take("f-cabinet", { x: 78.5, y: 43.5 }), "");
  assert.notEqual(
    s.placeFurniture("f-cabinet", HOME.entrance, 0, [HOME.spawn, HOME.child]),
    "",
  );
  assert.equal(s.item("f-cabinet")!.location.kind, "equipped");
  assert.equal(
    s.placeFurniture("f-cabinet", { x: 36.5, y: 49.5 }, 0, [
      HOME.spawn,
      HOME.child,
    ]),
    "",
  );
  assert.equal(s.take("key-01", { x: 53.5, y: 53.5 }), "");
  assert.equal(s.store("key-01", "f-cabinet", { x: 37.5, y: 49.5 }), "");
  assert.notEqual(s.take("f-cabinet", { x: 37.5, y: 49.5 }), "");
  const data = s.encode(HOME.spawn, true),
    load = new Possessions();
  assert.ok(load.load(JSON.stringify(data)));
  assert.deepEqual(load.item("key-01")!.location, {
    kind: "storage",
    target: "f-cabinet",
  });
  assert.equal(load.take("key-01", { x: 37.5, y: 49.5 }, "f-cabinet"), "");
  assert.equal(load.take("f-cabinet", { x: 37.5, y: 49.5 }), "");
});
test("optional power increases light but baseline safety and illumination never depend on it", () => {
  const s = state(),
    before = roomLight(HOME.spawn.x, HOME.spawn.y);
  assert.ok(before > 0.3);
  assert.equal(s.generatorPowered, false);
  s.item("f-generator")!.location = {
    kind: "world",
    position: { x: 37.5, y: 49.5 },
  };
  s.item("f-lamp")!.location = {
    kind: "world",
    position: { x: 39.5, y: 49.5 },
  };
  s.chapter.generatorOn = true;
  s.sync();
  assert.equal(s.lampPowered, true);
  homeEquipmentLight(s.lampPowered);
  assert.ok(roomLight(HOME.spawn.x, HOME.spawn.y) > before);
  homeEquipmentLight(false);
  assert.equal(roomLight(HOME.spawn.x, HOME.spawn.y), before);
  assert.equal(isSafe(HOME.spawn.x, HOME.spawn.y), true);
});
test("memory dialogue fires once and is suppressed during silent movement or danger", () => {
  const d = new Dialogue(),
    events: string[] = [],
    room = MEMORY_ROOMS[0],
    p = { x: 41.5, y: 11.5 };
  d.update(10, p, p, true, false, events, () => true);
  assert.equal(d.current, null);
  assert.equal(events.length, 0);
  d.update(20, p, p, false, false, events, () => true);
  const current = d.current as { speaker: string; text: string } | null;
  assert.equal(current?.speaker, "mother");
  assert.ok(current?.text.includes("freddo"));
  assert.ok(events.includes("kitchen"));
  d.update(1, p, p, true, false, events, () => true);
  assert.equal(d.current, null);
});
test("noclip anomalies are authored static geometry, never collectible item instances", () => {
  const s = state();
  assert.ok(ANOMALIES.length >= 8);
  assert.ok(
    ANOMALIES.some(
      (a) => a.kind === "armchair" && Math.abs(a.visualOffset![0]) > 0.4,
    ),
  );
  assert.equal(
    s.items.some((i) => ANOMALIES.some((a) => a.id === i.id)),
    false,
  );
  for (const r of MEMORY_ROOMS)
    assert.ok(
      pathfind(HOME.spawn, { x: r.x + r.w - 2.5, y: r.y + r.h - 2.5 }).length,
    );
});

test("a stationary child shares observed cover instead of remaining exposed beside a corner", () => {
  const p = { x: 48.5, y: 49.5 },
    child = new Companion({ x: 48.5, y: 50.5 }),
    threat = { x: 50.5, y: 50.5 };
  assert.equal(visible(threat.x, threat.y, p.x, p.y), false);
  assert.equal(
    visible(threat.x, threat.y, child.position.x, child.position.y),
    true,
  );
  for (let i = 0; i < 120; i++) {
    child.update(1 / 30, p, "walk", false, [threat]);
    assert.ok(canStand(child.position.x, child.position.y));
  }
  assert.equal(
    visible(threat.x, threat.y, child.position.x, child.position.y),
    false,
  );
  assert.ok(Math.hypot(child.position.x - p.x, child.position.y - p.y) > 0.2);
});
test("a portable crate retains contents and adds their weight when lifted, dropped and reloaded", () => {
  const s = state();
  assert.equal(s.take("key-01", { x: 53.5, y: 53.5 }), "");
  assert.equal(s.store("key-01", "f-crate", { x: 81.5, y: 25.5 }), "");
  assert.equal(s.weight, 0);
  assert.equal(s.take("f-crate", { x: 81.5, y: 25.5 }), "");
  assert.equal(s.weight, 3.1);
  assert.equal(s.storageAvailable("f-crate", { x: 53.5, y: 53.5 }), true);
  const load = new Possessions();
  assert.ok(load.load(JSON.stringify(s.encode(HOME.spawn, true))));
  assert.equal(load.weight, 3.1);
  assert.equal(load.drop("f-crate", { x: 53.5, y: 53.5 }), "");
  assert.equal(load.weight, 0);
  assert.deepEqual(load.item("key-01")!.location, {
    kind: "storage",
    target: "f-crate",
  });
});
