import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Possessions, owned } from "../src/possessions.ts";
import { setObstacles, solid, canStand, visible, move } from "../src/world.ts";
import { pathfind } from "../src/navigation.ts";
import { Creature } from "../src/creature.ts";
import { zoneAt } from "../src/zones.ts";
import { CONTROLS, actionFor } from "../src/controls.ts";
afterEach(() => setObstacles([]));
const create = () => {
  const c = new Possessions();
  c.sync();
  return c;
};
const take = (c: Possessions, id: string, p: { x: number; y: number }) =>
  assert.equal(c.take(id, p), "");
test("pick up, drop and retrieve keeps exactly one authoritative item", () => {
  const c = create(),
    p = { x: 53.5, y: 53.5 };
  take(c, "key-01", p);
  assert.equal(c.item("key-01")!.location.kind, "inventory");
  assert.notEqual(c.take("key-01", p), "");
  assert.equal(c.drop("key-01", p), "");
  const i = c.item("key-01")!;
  assert.equal(i.location.kind, "world");
  take(c, i.id, p);
  assert.equal(c.items.filter((i) => i.id === "key-01").length, 1);
  assert.equal(c.items.filter(owned).length, 1);
});
test("storage transfers and equipment capacity are transactional", () => {
  const c = create();
  take(c, "pack-01", { x: 55.5, y: 53.5 });
  assert.equal(c.equip("pack-01", "Back"), "");
  assert.equal(c.capacity, 22);
  assert.equal(c.store("pack-01", "cabinet", { x: 59.5, y: 54.5 }), "");
  assert.equal(c.capacity, 12);
  assert.equal(c.take("pack-01", { x: 59.5, y: 54.5 }, "cabinet"), "");
  take(c, "tool-01", { x: 79.5, y: 45.5 });
  assert.equal(c.equip("tool-01", "Utility").length > 0, true);
  assert.equal(c.equip("tool-01", "Right hand"), "");
  assert.notEqual(c.take("module-01", { x: 91.5, y: 45.5 }), "");
  assert.equal(c.item("module-01")!.location.kind, "world");
});
test("heavy cargo occupies both hands, slows movement, and accepts a body lamp", () => {
  const c = create();
  take(c, "module-01", { x: 91.5, y: 45.5 });
  assert.equal(c.hands, 2);
  assert.equal(c.canLight, false);
  assert.ok(c.speed < 0.85);
  assert.equal(c.canRush, false);
  assert.notEqual(c.unequip("module-01"), "");
  take(c, "lamp-01", { x: 81.5, y: 45.5 });
  assert.equal(c.equip("lamp-01", "Utility"), "");
  assert.equal(c.canLight, true);
  const p = { x: 91.5, y: 45.5 };
  assert.equal(c.drop("module-01", p), "");
  assert.equal(c.hands, 0);
  assert.ok(c.speed > 0.95);
  const i = c.item("module-01")!;
  assert.equal(i.location.kind, "world");
  if (i.location.kind === "world")
    assert.ok(solid(i.location.position.x, i.location.position.y));
  assert.ok(canStand(p.x, p.y));
  take(c, "module-01", p);
});
test("complete module delivery opens an otherwise unreachable underground passage", () => {
  const c = create();
  assert.equal(pathfind({ x: 86.5, y: 45.5 }, { x: 92.5, y: 44.5 }).length, 0);
  take(c, "key-01", { x: 53.5, y: 53.5 });
  assert.equal(c.use("key-01", "store-door", { x: 86.5, y: 45.5 }), "");
  assert.ok(pathfind({ x: 86.5, y: 45.5 }, { x: 91.5, y: 45.5 }).length > 0);
  take(c, "module-01", { x: 91.5, y: 45.5 });
  const path = pathfind({ x: 91.5, y: 45.5 }, { x: 61.5, y: 89.5 });
  assert.ok(path.length > 45);
  const p = { x: 91.5, y: 45.5 };
  for (const target of path) {
    let limit = 0;
    while (
      Math.hypot(target.x - p.x, target.y - p.y) > 0.03 &&
      limit++ < 1000
    ) {
      const dx = target.x - p.x,
        dy = target.y - p.y,
        d = Math.hypot(dx, dy),
        step = Math.min(d, 0.025 * c.speed);
      move(p, (dx / d) * step, (dy / d) * step);
      assert.ok(canStand(p.x, p.y));
    }
    assert.ok(limit < 1000);
  }
  assert.equal(pathfind(p, { x: 64.5, y: 100.5 }).length, 0);
  assert.equal(c.use("module-01", "drive", p), "");
  assert.equal(c.item("module-01")!.location.kind, "used");
  assert.equal(c.hands, 0);
  assert.ok(pathfind(p, { x: 64.5, y: 100.5 }).length > 0);
  assert.ok(c.active.has("shutter"));
  assert.notEqual(c.use("module-01", "drive", p), "");
  assert.equal(zoneAt(53, 53), "yellow");
  assert.equal(zoneAt(91, 45), "service");
  assert.equal(zoneAt(64, 100), "underground");
});
test("key, power and equipped-tool requirements reject incompatible use", () => {
  const c = create();
  take(c, "key-01", { x: 53.5, y: 53.5 });
  assert.notEqual(c.use("key-01", "service-cabinet", { x: 79.5, y: 48.5 }), "");
  take(c, "cell-01", { x: 55.5, y: 54.5 });
  assert.equal(c.use("cell-01", "service-cabinet", { x: 79.5, y: 48.5 }), "");
  assert.equal(
    c.take("harness-01", { x: 79.5, y: 48.5 }, "service-cabinet"),
    "",
  );
  assert.equal(c.equip("harness-01", "Torso"), "");
  take(c, "case-01", { x: 89.5, y: 74.5 });
  assert.equal(c.equip("case-01", "Cargo attachment"), "");
  assert.notEqual(c.unequip("harness-01"), "");
  take(c, "tool-01", { x: 79.5, y: 45.5 });
  assert.notEqual(c.use("tool-01", "panel", { x: 83.5, y: 42.5 }), "");
  assert.equal(c.equip("tool-01", "Right hand"), "");
  assert.equal(c.use("tool-01", "panel", { x: 83.5, y: 42.5 }), "");
});
test("save/load preserves dropped cargo, equipment, consumed module and mechanisms without duplication", () => {
  const c = create();
  take(c, "key-01", { x: 53.5, y: 53.5 });
  c.use("key-01", "store-door", { x: 86.5, y: 45.5 });
  take(c, "module-01", { x: 91.5, y: 45.5 });
  c.use("module-01", "drive", { x: 61.5, y: 89.5 });
  take(c, "pack-01", { x: 55.5, y: 53.5 });
  c.equip("pack-01", "Back");
  take(c, "case-01", { x: 89.5, y: 74.5 });
  c.drop("case-01", { x: 89.5, y: 74.5 });
  const data = c.encode({ x: 64.5, y: 100.5 }, false),
    copy = new Possessions();
  assert.deepEqual(copy.load(JSON.stringify(data)), {
    player: data.player,
    lightRequested: false,
  });
  assert.deepEqual(copy.encode(data.player, false), data);
  const malformed = structuredClone(data);
  malformed.items[0] = malformed.items[1];
  assert.equal(new Possessions().load(JSON.stringify(malformed)), null);
  assert.equal(new Possessions().load("{bad"), null);
  assert.equal(
    new Possessions().load(JSON.stringify({ ...data, version: 0 })),
    null,
  );
  const forged = structuredClone(data);
  forged.items.find((i) => i.id === "module-01")!.location = {
    kind: "inventory",
  };
  assert.equal(new Possessions().load(JSON.stringify(forged)), null);
});
test("darkness does not advertise items and moving cargo invalidates creature navigation safely", () => {
  const c = create(),
    p = { x: 53.5, y: 53.5 };
  const dark = { x: 53.5, y: 43.5 };
  c.item("key-01")!.location = {
    kind: "world",
    position: { x: 54.5, y: 43.5 },
  };
  assert.equal(c.nearby(dark, { ...dark, angle: 0, on: false }), undefined);
  c.item("key-01")!.location = {
    kind: "world",
    position: { x: 54.5, y: 53.5 },
  };
  assert.equal(c.nearby(p, { ...p, angle: 0, on: true })?.id, "key-01");
  const creature = new Creature(() => 0.35);
  creature.position = { x: 91.5, y: 45.5 };
  creature.update(0.1, { x: 94.5, y: 45.5 });
  take(c, "module-01", { x: 91.5, y: 44.5 });
  c.drop("module-01", { x: 93.5, y: 45.5 }, [creature.position]);
  for (let i = 0; i < 600; i++) {
    creature.update(1 / 60, null);
    assert.ok(canStand(creature.position.x, creature.position.y));
  }
  assert.equal(visible(64.5, 93.5, 64.5, 95.5), false);
});
test("Help and input share centralized bindings", () => {
  assert.equal(actionFor("KeyH"), "help");
  assert.equal(actionFor("Tab"), "inventory");
  assert.equal(actionFor("Escape"), "close");
  assert.equal(actionFor("KeyF"), undefined);
  assert.ok(CONTROLS.filter((c) => "label" in c).length >= 9);
});
test("blocking the last-known cell causes a bounded search, never permanent pursuit", () => {
  const c = new Creature(() => 0.25);
  c.position = { x: 53.5, y: 49.5 };
  for (let i = 0; i < 50; i++) c.update(1 / 60, { x: 53.5, y: 53.5 });
  setObstacles([{ x: 53, y: 53 }]);
  let searching = false,
    wandering = false;
  for (let i = 0; i < 1500; i++) {
    c.update(1 / 60, null);
    if (c.state === "searching") searching = true;
    if (searching && c.state === "wandering") wandering = true;
    assert.ok(canStand(c.position.x, c.position.y));
  }
  assert.ok(searching && wandering);
});
test("dropping cargo near a cell corner cannot block the player or creature cell", () => {
  const c = create();
  take(c, "module-01", { x: 91.5, y: 45.5 });
  const player = { x: 91.02, y: 45.02 },
    creature = { x: 92.5, y: 45.5 };
  assert.equal(c.drop("module-01", player, [creature]), "");
  assert.ok(canStand(player.x, player.y));
  assert.ok(canStand(creature.x, creature.y));
});
