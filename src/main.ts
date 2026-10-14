import "./style.css";
import { VIEW } from "./config";
import { Flashlight } from "./flashlight";
import { screenToWorld } from "./geometry";
import { InputState } from "./input";
import { loadNativeGame } from "./native";
import { SceneRenderer } from "./scene-renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const game = await loadNativeGame();
const flashlight = new Flashlight();
const input = new InputState(() => flashlight.toggle());
const renderer = new SceneRenderer(canvas, game, flashlight);
let lastFrame = performance.now();

function frame(now: number) {
  const dt = Math.min(0.04, (now - lastFrame) / 1000);
  lastFrame = now;
  const movement = input.movement();
  game.update(dt, movement.horizontal, movement.vertical, movement.running);
  renderer.render(now);
  requestAnimationFrame(frame);
}

addEventListener("resize", () => renderer.resize());
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * renderer.width;
  const y = ((event.clientY - rect.top) / rect.height) * renderer.height;
  flashlight.aim(
    screenToWorld(
      x - renderer.width / 2,
      y - (renderer.height / 2 + VIEW.cameraY),
    ),
  );
});

requestAnimationFrame(frame);

if (import.meta.env.DEV)
  window.__liminal = {
    snapshot: () => ({
      player: game.player(),
      brother: game.brother(),
      torchOn: flashlight.on,
      angle: flashlight.angle,
      lightRange: flashlight.range,
    }),
  };
