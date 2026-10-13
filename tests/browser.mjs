import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
const server = spawn(
  "npm",
  ["run", "dev", "--", "--port", "5174", "--strictPort"],
  { stdio: "ignore", detached: true },
);
let browser;

(async () => {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:5174")).ok) break;
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
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        this.probe = this.createAnalyser();
        const mute = super.createGain();
        mute.gain.value = 0;
        this.probe.connect(mute);
        mute.connect(this.destination);
        window.__audioProbe = this.probe;
      }
      createGain() {
        const gain = super.createGain();
        if (!this.attached) {
          gain.connect(this.probe);
          this.attached = true;
        }
        return gain;
      }
    };
  });
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(() => window.__liminal);
  const state = () => page.evaluate(() => window.__liminal.snapshot());
  const place = (p, c, a, on = true) =>
    page.evaluate(({ p, c, a, on }) => window.__liminal.place(p, c, a, on), {
      p,
      c,
      a,
      on,
    });
  await page.keyboard.press("Shift");
  await page.waitForTimeout(1000);
  assert.equal((await state()).audio, "running");
  const peak = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let max = 0,
          frames = 0;
        const samples = new Float32Array(window.__audioProbe.fftSize);
        function sample() {
          window.__audioProbe.getFloatTimeDomainData(samples);
          for (const v of samples) max = Math.max(max, Math.abs(v));
          if (frames++ < 80) requestAnimationFrame(sample);
          else resolve(max);
        }
        sample();
      }),
  );
  assert.ok(peak > 0.001, "Heartbeat must produce a non-silent audio signal");
  await place({ x: 53.5, y: 43.5 }, { x: 71.5, y: 70.5 }, 0);
  await page.waitForTimeout(150);
  const bodyBrightness = () =>
    page.evaluate(() => {
      const c = document.querySelector("canvas"),
        ctx = c.getContext("2d");
      const pixels = ctx.getImageData(
        Math.floor(c.width / 2) - 2,
        Math.floor(c.height / 2) - 10,
        4,
        16,
      ).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4)
        sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
      return sum;
    });
  const litBody = await bodyBrightness();
  await page.keyboard.press("Space");
  await page.waitForTimeout(50);
  const darkBody = await bodyBrightness();
  assert.ok(litBody > darkBody * 3, "Player must darken with flashlight off");
  await page.keyboard.press("Space");
  await page.keyboard.down("d");
  await page.waitForTimeout(1100);
  await page.keyboard.up("d");
  const moving = await state();
  assert.equal(moving.beats, moving.audioBeats);
  assert.ok(moving.steps > 1);
  await page.waitForTimeout(350);
  assert.ok(
    (await state()).steps >= moving.steps,
    "The child may finish catching up after the older brother stops",
  );
  assert.ok((await state()).bpm < 71);
  await page.keyboard.press("Space");
  assert.equal((await state()).lightOn, false);
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  assert.equal((await state()).lightOn, true);
  await page.keyboard.up("Space");
  await page.keyboard.press("f");
  assert.equal((await state()).lightOn, true);
  await place({ x: 53.5, y: 43.5 }, { x: 53.5, y: 40.5 }, -Math.PI / 2);
  await page.waitForTimeout(250);
  assert.equal((await state()).state, "reacting");

  await page.waitForTimeout(600);
  const detected = await state();
  assert.equal(detected.state, "pursuing");
  assert.ok(detected.creatureLight > 0.055);
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  const remembered = await state();
  assert.equal(remembered.state, "remembering");
  assert.equal(remembered.creatureLight, 0);
  await page.keyboard.down("d");
  await page.waitForTimeout(700);
  await page.keyboard.up("d");
  const escaped = await state();
  assert.deepEqual(escaped.lastKnown, remembered.lastKnown);
  assert.notDeepEqual(escaped.player, remembered.player);

  await page.waitForTimeout(14000);
  const searched = await state();
  assert.equal(searched.capture, null);
  assert.equal(searched.state, "wandering");
  await place({ x: 53.5, y: 43.5 }, { x: 53.5, y: 43.15 }, -Math.PI / 2);
  await page.waitForTimeout(900);
  const caught = await state();
  assert.notEqual(caught.capture, null);
  await page.waitForTimeout(2700);
  const reset = await state();
  assert.equal(reset.capture, null);
  assert.deepEqual(reset.player, { x: 40.5, y: 50.5 });
  assert.equal(reset.lightOn, true);
  await place({ x: 48.5, y: 49.5 }, { x: 50.5, y: 49.5 }, 0);
  await page.waitForTimeout(900);
  const blocked = await state();
  assert.equal(blocked.state, "wandering");
  assert.equal(blocked.creatureLight, 0);
  await place({ x: 53.5, y: 43.5 }, { x: 55.5, y: 43.5 }, Math.PI, false);
  await page.waitForTimeout(4300);
  const heard = await state();
  assert.ok(heard.audible > 0.015);
  assert.ok(heard.bpm > 75 && heard.bpm < 120);
  assert.equal(heard.state, "wandering");

  // Help, inventory, and character menus pause the same simulation and audio.
  await place({ x: 53.5, y: 53.5 }, { x: 88.5, y: 80.5 }, 0);
  await page.keyboard.press("h");
  await page.waitForTimeout(100);
  assert.equal((await state()).menu, "help");
  await page.getByText("FIELD REFERENCE", { exact: true }).waitFor();
  const frozen = await state();
  await page.keyboard.down("d");
  await page.waitForTimeout(400);
  await page.keyboard.up("d");
  assert.deepEqual((await state()).player, frozen.player);
  assert.deepEqual((await state()).creature, frozen.creature);
  assert.equal((await state()).beats, frozen.beats);
  await page.keyboard.press("h");
  assert.equal((await state()).menu, null);
  await page.keyboard.down("d");
  await page.waitForTimeout(150);
  await page.keyboard.up("d");
  assert.notDeepEqual((await state()).player, frozen.player);
  await place({ x: 53.5, y: 53.5 }, { x: 88.5, y: 80.5 }, 0);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  const item = (s, id) => s.inventory.items.find((i) => i.id === id);
  assert.equal(item(await state(), "key-01").location.kind, "inventory");
  await page.keyboard.press("Tab");
  await page.locator('[data-item="key-01"]').click();
  await page.getByRole("button", { name: "Drop", exact: true }).click();
  assert.equal(item(await state(), "key-01").location.kind, "world");
  await page.keyboard.press("Escape");
  const dropped = item(await state(), "key-01").location.position;
  const playerNow = (await state()).player;
  await place(
    playerNow,
    { x: 88.5, y: 80.5 },
    Math.atan2(dropped.y - playerNow.y, dropped.x - playerNow.x),
  );
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  assert.equal(item(await state(), "key-01").location.kind, "inventory");
  await place({ x: 55.5, y: 53.5 }, { x: 88.5, y: 80.5 }, 0);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  await page.keyboard.press("c");
  await page.locator('[data-item="pack-01"]').click();
  await page.getByRole("button", { name: "Equip · Back", exact: true }).click();
  assert.equal(item(await state(), "pack-01").location.slot, "Back");
  await page.screenshot({ path: "/tmp/liminal-equipment.png" });
  await page.keyboard.press("Escape");
  await place({ x: 86.5, y: 45.5 }, { x: 53.5, y: 30.5 }, 0);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  assert.ok((await state()).inventory.active.includes("store-door"));
  await place({ x: 91.5, y: 45.5 }, { x: 53.5, y: 30.5 }, 0);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  const carrying = await state();
  assert.equal(item(carrying, "module-01").location.kind, "equipped");
  assert.equal(carrying.canLight, false);
  assert.ok(carrying.speed < 0.85);
  assert.equal(carrying.creatureLight, 0);
  await page.screenshot({ path: "/tmp/liminal-cargo-dark.png" });
  await page.keyboard.press("i");
  await page.locator('[data-item="module-01"]').click();
  await page.getByRole("button", { name: "Drop", exact: true }).click();
  assert.equal((await state()).canLight, true);
  await page.keyboard.press("Escape");
  const moduleDrop = item(await state(), "module-01").location.position;
  await place(
    { x: 91.5, y: 45.5 },
    { x: 53.5, y: 30.5 },
    Math.atan2(moduleDrop.y - 45.5, moduleDrop.x - 91.5),
  );
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  assert.equal(item(await state(), "module-01").location.kind, "equipped");
  // A lamp must be obtained before filling both hands, or cargo temporarily set down.
  await page.keyboard.press("i");
  await page.locator('[data-item="module-01"]').click();
  await page.getByRole("button", { name: "Drop", exact: true }).click();
  await page.keyboard.press("Escape");
  const moduleFloor = item(await state(), "module-01").location.position;
  await place({ x: 81.5, y: 45.5 }, { x: 53.5, y: 30.5 }, Math.PI / 2);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  await page.keyboard.press("c");
  await page.locator('[data-item="lamp-01"]').click();
  await page
    .getByRole("button", { name: "Equip · Utility", exact: true })
    .click();
  await page.keyboard.press("Escape");
  const approach = { x: moduleFloor.x - 1, y: moduleFloor.y };
  await place(approach, { x: 53.5, y: 30.5 }, 0);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  assert.equal((await state()).canLight, true);
  assert.equal(item(await state(), "module-01").location.kind, "equipped");
  await page.keyboard.press("c");
  await page.screenshot({ path: "/tmp/liminal-cargo-equipped.png" });
  await page.keyboard.press("Escape");
  await place({ x: 61.5, y: 89.5 }, { x: 53.5, y: 30.5 }, 0);
  await page.waitForTimeout(100);
  await page.keyboard.press("e");
  const delivered = await state();
  assert.ok(delivered.inventory.active.includes("shutter"));
  assert.equal(item(delivered, "module-01").location.kind, "used");
  assert.equal(delivered.zone, "underground");
  await page.evaluate(() => window.__liminal.save());
  await page.reload();
  await page.waitForFunction(() => window.__liminal);
  const loaded = await state();
  assert.deepEqual(loaded.inventory.items, delivered.inventory.items);
  assert.ok(loaded.inventory.active.includes("shutter"));
  assert.equal(loaded.state, "wandering");
  assert.equal(
    new Set(loaded.inventory.items.map((i) => i.id)).size,
    loaded.inventory.items.length,
  );
  // Progressive map: menus freeze simulation, and unknown stages stay unnamed.
  await page.keyboard.press("i");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("heading", { name: "EXPLORED SPACES" }).waitFor();
  assert.equal(
    await page.getByText("The Empty Mall", { exact: false }).count(),
    0,
  );
  const mapped = await state();
  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  await page.keyboard.up("d");
  assert.deepEqual((await state()).player, mapped.player);
  assert.deepEqual((await state()).creature, mapped.creature);
  await page.keyboard.press("Escape");
  await page.keyboard.down("d");
  await page.waitForTimeout(150);
  await page.keyboard.up("d");
  assert.notDeepEqual((await state()).player, mapped.player);
  await place({ x: 20.5, y: 33.5 }, { x: 53.5, y: 30.5 }, 0, false);
  await page.waitForTimeout(200);
  assert.equal((await state()).zone, "mall");
  assert.equal((await state()).creatureLight, 0);
  assert.ok(
    (await bodyBrightness()) > darkBody * 3,
    "Overhead lighting must illuminate the character with the torch off",
  );
  await page.screenshot({ path: "/tmp/liminal-mall.png" });
  await page.keyboard.press("i");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  assert.equal(
    await page.getByText("The Empty Mall", { exact: false }).count(),
    1,
  );
  assert.equal(
    await page.getByText("Forgotten Playground", { exact: false }).count(),
    0,
  );
  await page.keyboard.press("Escape");
  await place({ x: 23.5, y: 12.5 }, { x: 53.5, y: 30.5 }, 0, false);
  await page.waitForTimeout(200);
  assert.equal((await state()).zone, "playground");
  await page.screenshot({ path: "/tmp/liminal-playground.png" });
  const explored = (await state()).inventory.explored;
  assert.ok(explored.length > mapped.inventory.explored.length);
  await page.evaluate(() => window.__liminal.save());
  await page.reload();
  await page.waitForFunction(() => window.__liminal);
  assert.deepEqual((await state()).inventory.explored, explored);
  await page.keyboard.press("i");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  assert.equal(
    await page.getByText("Forgotten Playground", { exact: false }).count(),
    1,
  );
  await page.screenshot({ path: "/tmp/liminal-map.png" });
  await page.keyboard.press("Escape");
  // A beam from the lit annex must not invite the creature into it.
  await place({ x: 42.5, y: 47.5 }, { x: 44.5, y: 47.5 }, 0);
  await page.waitForTimeout(1800);
  assert.equal((await state()).lastKnown, null);
  assert.ok((await state()).creature.x >= 43);
  assert.equal((await state()).capture, null);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollHeight > innerHeight,
    ),
    false,
  );
  console.log(
    JSON.stringify(
      {
        stealth: "passed",
        inventory: "passed",
        equipment: "passed",
        helpPauseResume: "passed",
        transport: "passed",
        persistence: "passed",
        explorationAndLitStages: "passed",
        litBody,
        darkBody,
        audioPeak: peak,
        errors,
      },
      null,
      2,
    ),
  );
  assert.equal(errors.length, 0);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  });
