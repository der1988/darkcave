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
  await place({ x: 53.5, y: 53.5 }, { x: 88.5, y: 80.5 }, 0);
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
  assert.equal((await state()).steps, moving.steps);
  assert.ok((await state()).bpm < 71);
  await page.keyboard.press("Space");
  assert.equal((await state()).lightOn, false);
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  assert.equal((await state()).lightOn, true);
  await page.keyboard.up("Space");
  await page.keyboard.press("f");
  assert.equal((await state()).lightOn, true);
  await place({ x: 53.5, y: 53.5 }, { x: 53.5, y: 49.5 }, -Math.PI / 2);
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
  await place({ x: 53.5, y: 53.5 }, { x: 53.5, y: 53.15 }, -Math.PI / 2);
  await page.waitForTimeout(900);
  const caught = await state();
  assert.notEqual(caught.capture, null);
  await page.waitForTimeout(2700);
  const reset = await state();
  assert.equal(reset.capture, null);
  assert.deepEqual(reset.player, { x: 53.5, y: 53.5 });
  assert.equal(reset.lightOn, true);
  await place({ x: 48.5, y: 49.5 }, { x: 50.5, y: 49.5 }, 0);
  await page.waitForTimeout(900);
  const blocked = await state();
  assert.equal(blocked.state, "wandering");
  assert.equal(blocked.creatureLight, 0);
  await place({ x: 53.5, y: 53.5 }, { x: 55.5, y: 53.5 }, Math.PI, false);
  await page.waitForTimeout(4300);
  const heard = await state();
  assert.ok(heard.audible > 0.015);
  assert.ok(heard.bpm > 75 && heard.bpm < 120);
  assert.equal(heard.state, "wandering");
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
        moving,
        detected,
        remembered,
        escaped,
        searched,
        caught,
        reset,
        blocked,
        heard,
        litBody,
        darkBody,
        peak,
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
