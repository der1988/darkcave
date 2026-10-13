import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
const server = spawn(
  "npm",
  ["run", "dev", "--", "--port", "5176", "--strictPort"],
  { stdio: "ignore", detached: true },
);
let browser;
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch("http://127.0.0.1:5176")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5176");
  await page.waitForFunction(() => window.__liminal);
  const state = () => page.evaluate(() => window.__liminal.snapshot());
  const item = async (id) =>
    (await state()).inventory.items.find((i) => i.id === id);
  const place = async (p, angle = 0, on = true, c = { x: 71.5, y: 70.5 }) => {
    await page.evaluate(
      ({ p, angle, on, c }) => window.__liminal.place(p, c, angle, on),
      { p, angle, on, c },
    );
    await page.waitForTimeout(120);
  };
  const press = async (key) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(80);
  };
  assert.deepEqual((await state()).player, { x: 40.5, y: 50.5 });
  assert.deepEqual((await state()).companion, { x: 40.6, y: 49.8 });
  assert.equal((await state()).enemies.length, 8);
  await page.screenshot({ path: "/tmp/liminal-chapter-home.png" });
  const before = await state();
  await page.keyboard.down("Control");
  await page.keyboard.down("Shift");
  await page.keyboard.down("d");
  await page.waitForTimeout(800);
  await page.keyboard.up("d");
  await page.keyboard.up("Shift");
  const silent = await state();
  assert.equal(silent.gait, "silent");
  assert.equal(silent.childGait, "silent");
  assert.equal(silent.noises.filter((e) => e.category === "step").length, 0);
  assert.equal(silent.dialogue, null);
  assert.ok(
    Math.hypot(
      silent.player.x - before.player.x,
      silent.player.y - before.player.y,
    ) < 0.6,
  );
  await page.keyboard.up("Control");
  await press("i");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  assert.equal((await state()).menu, "map");
  const frozen = await state(),
    map = () => page.locator(".exploration-map").evaluate((c) => c.toDataURL());
  const initial = await map();
  await page.getByRole("button", { name: "Zoom +", exact: true }).click();
  const zoom = await map();
  assert.notEqual(zoom, initial);
  await page.getByRole("button", { name: "→", exact: true }).click();
  assert.notEqual(await map(), zoom);
  await page.getByRole("button", { name: "Recenter", exact: true }).click();
  assert.equal(await map(), zoom);
  await page.waitForTimeout(250);
  assert.deepEqual((await state()).companion, frozen.companion);
  assert.deepEqual((await state()).enemies, frozen.enemies);
  assert.equal((await state()).health, frozen.health);
  await page.screenshot({ path: "/tmp/liminal-chapter-map.png" });
  await press("h");
  await page.getByText("CTRL", { exact: true }).waitFor();
  await press("Escape");
  await place({ x: 36.5, y: 46.5 }, -Math.PI / 2);
  await press("e");
  await page
    .getByRole("heading", { name: "LIMINAL — MEMORY ARCHIVE" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "LAYER 02", exact: true })
      .isDisabled(),
    true,
  );
  await press("Escape");
  await place({ x: 41.5, y: 11.5 }, Math.PI);
  await page.waitForTimeout(8500);
  assert.equal((await state()).dialogue?.speaker, "mother");
  assert.ok((await state()).inventory.chapter.events.includes("kitchen"));
  await page.screenshot({ path: "/tmp/liminal-chapter-kitchen.png" });
  await page.keyboard.down("Control");
  await page.waitForTimeout(80);
  assert.equal((await state()).dialogue, null);
  await page.keyboard.up("Control");
  await place({ x: 43.5, y: 12.5 });
  await press("e");
  assert.equal((await item("memory-cup")).location.kind, "inventory");
  await place({ x: 35.5, y: 45.5 }, Math.PI);
  await press("e");
  assert.equal((await item("memory-cup")).location.kind, "used");
  assert.equal((await state()).complete, false);
  await place({ x: 6.5, y: 48.5 }, Math.PI);
  await page.waitForTimeout(8500);
  assert.equal((await state()).dialogue?.speaker, "father");
  await page.screenshot({ path: "/tmp/liminal-chapter-living.png" });
  await place({ x: 7.5, y: 49.5 });
  await press("e");
  assert.equal((await item("memory-photo")).location.kind, "inventory");
  await place({ x: 35.5, y: 45.5 }, Math.PI);
  await press("e");
  assert.equal((await state()).complete, true);
  await press("e");
  assert.equal(
    (await state()).inventory.items.filter(
      (i) => i.location.kind === "used" && i.location.target === "archive",
    ).length,
    2,
  );
  await place({ x: 36.5, y: 46.5 }, -Math.PI / 2);
  await press("e");
  assert.equal(
    await page
      .getByRole("button", { name: "LAYER 02", exact: true })
      .isDisabled(),
    false,
  );
  await page.getByRole("button", { name: "LAYER 02", exact: true }).click();
  await page
    .getByText("Destinazione sbloccata, ma non ancora disponibile.")
    .waitFor();
  await page.screenshot({ path: "/tmp/liminal-chapter-computer.png" });
  await press("Escape");
  const placeFurniture = async (id, x, y) => {
    await place({ x: 39.5, y: 50.5 });
    await press("i");
    await page.locator(`[data-item="${id}"]`).click();
    await page
      .getByRole("button", { name: "Sistema in casa", exact: true })
      .click();
    await page.getByRole("button", { name: "Ruota · 0°", exact: true }).click();
    await page
      .getByRole("button", { name: "Ruota · 90°", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Place at ${x}, ${y}`, exact: true })
      .click();
    assert.equal((await item(id)).location.kind, "world");
    await press("Escape");
  };
  await place({ x: 78.5, y: 43.5 });
  await press("e");
  assert.equal((await item("f-cabinet")).location.kind, "equipped");
  assert.equal((await state()).canLight, false);
  await placeFurniture("f-cabinet", 36, 49);
  await place({ x: 53.5, y: 53.5 });
  await press("e");
  assert.equal((await item("key-01")).location.kind, "inventory");
  await place({ x: 37.5, y: 49.5 }, Math.PI);
  await press("e");
  await page.locator('[data-item="key-01"]').click();
  await page.getByRole("button", { name: "Store", exact: true }).click();
  assert.deepEqual((await item("key-01")).location, {
    kind: "storage",
    target: "f-cabinet",
  });
  await page
    .getByRole("button", { name: "Sposta mobile", exact: true })
    .click();
  assert.equal((await item("f-cabinet")).location.kind, "world");
  await press("Escape");
  await place({ x: 87.5, y: 66.5 });
  await press("e");
  assert.equal((await item("f-generator")).location.kind, "equipped");
  await placeFurniture("f-generator", 36, 48);
  await place({ x: 89.5, y: 67.5 });
  await press("e");
  assert.equal((await item("f-lamp")).location.kind, "equipped");
  await placeFurniture("f-lamp", 38, 49);
  await place({ x: 37.5, y: 48.5 }, Math.PI);
  await press("e");
  await page
    .getByRole("button", { name: "Accendi generatore", exact: true })
    .click();
  assert.equal((await state()).power, true);
  await press("Escape");
  await page.evaluate(() => {
    window.__liminal.cargo.chapter.health = 50;
    window.__liminal.cargo.chapter.childHealth = 60;
  });
  await page.waitForTimeout(550);
  assert.ok((await state()).health > 50);
  assert.ok((await state()).childHealth > 60);
  await page.evaluate(() => window.__liminal.save());
  const saved = await state();
  await page.reload();
  await page.waitForFunction(() => window.__liminal);
  const loaded = await state();
  assert.equal(loaded.complete, true);
  assert.equal(loaded.power, true);
  assert.deepEqual(loaded.inventory.items, saved.inventory.items);
  assert.deepEqual(loaded.inventory.maps, saved.inventory.maps);
  assert.ok(loaded.inventory.chapter.events.includes("living"));
  // Damage, pause and invulnerability use the same real simulation.
  await place({ x: 53.5, y: 53.5 }, Math.PI);
  await page.evaluate(() =>
    window.__liminal.setInhabitant("z-arrival", { x: 53.8, y: 53.5 }),
  );
  await page.waitForTimeout(250);
  assert.equal((await state()).health, 82);
  await press("h");
  const hurt = await state();
  await page.waitForTimeout(1500);
  assert.equal((await state()).health, hurt.health);
  assert.deepEqual((await state()).enemies, hurt.enemies);
  await press("Escape");
  await place({ x: 53.5, y: 43.5 }, Math.PI, true, { x: 52.6, y: 43.5 });
  await page.waitForTimeout(950);
  assert.notEqual((await state()).capture, null);
  await page.waitForTimeout(2700);
  assert.deepEqual((await state()).player, { x: 40.5, y: 50.5 });
  assert.deepEqual((await state()).companion, { x: 40.6, y: 49.8 });
  await place({ x: 11.5, y: 73.5 }, Math.PI);
  await page.screenshot({ path: "/tmp/liminal-chapter-hotel.png" });
  await place({ x: 49.5, y: 31.5 }, -Math.PI / 2);
  await page.screenshot({ path: "/tmp/liminal-chapter-anomaly.png" });
  await place({ x: 20.5, y: 33.5 }, 0, false);
  const timing = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let previous = performance.now(),
          times = [];
        function tick(now) {
          times.push(now - previous);
          previous = now;
          if (times.length < 90) requestAnimationFrame(tick);
          else {
            times.sort((a, b) => a - b);
            resolve({ medianMs: times[45], p95Ms: times[85] });
          }
        }
        requestAnimationFrame(tick);
      }),
  );
  assert.ok(timing.medianMs < 35);
  await place({x:36.5,y:46.5},-Math.PI/2);await press('e');
  await page.getByRole('button',{name:'Nuova partita',exact:true}).click();
  assert.equal((await state()).complete,true,'First click must not reset progress');
  await page.getByRole('button',{name:'Conferma nuova partita',exact:true}).click();
  assert.equal((await state()).complete,false);assert.equal((await item('memory-cup')).location.kind,'world');
  assert.ok(await page.evaluate(()=>localStorage.getItem('liminal.transport.v1.backup')));
  await place({x:36.5,y:46.5},-Math.PI/2);await press('e');
  await page.getByRole('button',{name:'Ripristina copia precedente',exact:true}).click();
  await page.getByRole('button',{name:'Conferma ripristino',exact:true}).click();
  assert.equal((await state()).complete,true);assert.equal((await state()).power,true);
  assert.ok(await page.evaluate(()=>localStorage.getItem('liminal.transport.v1.before-restore')));
  await page.setViewportSize({ width: 390, height: 844 });
  await press("i");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        chapter: "passed",
        companion: "passed",
        silent: "passed",
        memoryDelivery: "passed",
        furnitureAndPower: "passed",
        mapControls: "passed",
      newGameAndRestore: "passed",
        persistence: "passed",
        damagePauseAndChildCapture: "passed",
        timing,
        errors,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
}
