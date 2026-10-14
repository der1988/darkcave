import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

type Core = {
  reset(): void;
  update(dt: number, horizontal: number, vertical: number, running: number): void;
  player_x(): number;
  player_y(): number;
  brother_x(): number;
  brother_y(): number;
  room_width(): number;
  room_height(): number;
};

const bytes = await readFile(new URL("../public/liminal-core.wasm", import.meta.url));
const module = await WebAssembly.compile(bytes);
const { exports } = await WebAssembly.instantiate(module);
const core = exports as unknown as Core;

test("the C++ core is a self-contained WebAssembly module", () => {
  assert.deepEqual(WebAssembly.Module.imports(module), []);
  assert.ok(WebAssembly.Module.exports(module).some((entry) => entry.name === "update"));
});

test("screen-relative movement is normalized", () => {
  core.reset();
  const startX = core.player_x();
  const startY = core.player_y();
  core.update(0.04, 1, 0, 0);
  const horizontalDistance = Math.hypot(core.player_x() - startX, core.player_y() - startY);
  core.reset();
  core.update(0.04, 1, 1, 0);
  const diagonalDistance = Math.hypot(core.player_x() - startX, core.player_y() - startY);
  assert.ok(Math.abs(horizontalDistance - diagonalDistance) < 0.0001);
});

test("the player remains inside the room", () => {
  core.reset();
  for (let index = 0; index < 500; index++) core.update(0.04, -1, -1, 1);
  assert.ok(core.player_x() >= 0.239 && core.player_y() >= 0.239);
  for (let index = 0; index < 1000; index++) core.update(0.04, 1, 1, 1);
  assert.ok(core.player_x() <= core.room_width() - 0.239);
  assert.ok(core.player_y() <= core.room_height() - 0.239);
});

test("the younger brother follows at a short distance", () => {
  core.reset();
  for (let index = 0; index < 140; index++) core.update(1 / 60, 1, 0, 0);
  const gap = Math.hypot(
    core.player_x() - core.brother_x(),
    core.player_y() - core.brother_y(),
  );
  assert.ok(gap >= 0.46 && gap < 0.56, `unexpected gap ${gap}`);
});
