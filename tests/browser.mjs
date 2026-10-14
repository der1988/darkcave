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
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch("http://127.0.0.1:5174")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(() => window.__liminal);
  const state = () => page.evaluate(() => window.__liminal.snapshot());

  const initial = await state();
  assert.equal(initial.torchOn, true);
  await page.keyboard.press("Space");
  assert.equal((await state()).torchOn, false);
  await page.keyboard.press("Space");
  assert.equal((await state()).torchOn, true);
  await page.keyboard.press("f");
  assert.equal((await state()).torchOn, false);
  await page.keyboard.press("f");
  assert.equal((await state()).torchOn, true);

  await page.mouse.move(1100, 400);
  const aimed = await state();
  assert.notEqual(aimed.angle, initial.angle);
  assert.notEqual(aimed.lightRange, initial.lightRange);

  await page.mouse.move(760, 400);
  const nearAim = await state();
  await page.mouse.move(1100, 400);
  const farAim = await state();
  assert.ok(farAim.lightRange > nearAim.lightRange);

  await page.keyboard.down("d");
  await page.waitForTimeout(700);
  await page.keyboard.up("d");
  const walked = await state();
  assert.notDeepEqual(walked.player, initial.player);
  assert.ok(
    Math.hypot(
      walked.player.x - walked.brother.x,
      walked.player.y - walked.brother.y,
    ) < 0.65,
  );
  await page.screenshot({ path: "/tmp/liminal-foundation.png" });

  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      movement: "passed",
      flashlight: "passed",
      brother: "passed",
      errors,
    }),
  );
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
}
