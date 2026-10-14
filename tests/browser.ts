import { project } from "../src/geometry.ts";
import { ROOM } from "../src/room.ts";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const server = spawn(
  "npm",
  ["run", "dev", "--", "--port", "5174", "--strictPort"],
  { stdio: "ignore", detached: true },
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
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
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5174");
  await page.waitForFunction(() => window.__liminal);
  const state = () => page.evaluate(() => window.__liminal!.snapshot());

  const initial = await state();
  assert.equal(initial.torchOn, true);
  await page.keyboard.press("Space");
  assert.equal((await state()).torchOn, false);
  await page.keyboard.press("Space");
  assert.equal((await state()).torchOn, true);
  assert.ok(await page.locator(".controls").isVisible());
  const stone = initial.objects[0];
  const center = project(ROOM.width / 2, ROOM.height / 2),
    item = project(stone.x, stone.y);
  const screenX = (item.x + 320 - center.x) * 2,
    screenY = (item.y + 200 - center.y + 25) * 2;
  await page.mouse.click(screenX, screenY);
  assert.equal((await state()).heldObject?.id, stone.id);
  assert.equal(
    (await state()).objects.filter((item) => item.state === "held").length,
    1,
  );
  await page.mouse.move(900, 500);
  await page.mouse.down();
  await page.waitForTimeout(500);
  assert.ok((await state()).chargePower! > 0.15);
  await page.mouse.up();
  assert.equal((await state()).heldObject, null);
  await page.waitForFunction(
    (id) =>
      window.__liminal!.snapshot().objects.find((item) => item.id === id)
        ?.state === "ground",
    stone.id,
  );
  await page.mouse.move(900, 270);
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
  await page.waitForFunction(
    () => window.__liminal?.snapshot().dialogue !== null,
  );
  assert.ok((await state()).dialogue?.text);
  await page.screenshot({ path: "/tmp/liminal-foundation.png" });

  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      movement: "passed",
      mallScene: "rendered",
      flashlightToggle: "passed",
      brother: "passed",
      dialogue: "passed",
      pickupAndChargedThrow: "passed",
      errors,
    }),
  );
} finally {
  await browser?.close();
  try {
    if (server.pid) process.kill(-server.pid, "SIGTERM");
  } catch {}
}
