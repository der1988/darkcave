import "./style.css";
import { InputState } from "./input";
import { createGame } from "./game";
import { SceneRenderer } from "./scene-renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const game = createGame();
const input = new InputState();
const renderer = new SceneRenderer(canvas, game);
let lastFrame = performance.now();

function frame(now: number) {
  const dt = Math.min(0.04, (now - lastFrame) / 1000);
  lastFrame = now;
  const movement = input.movement();
  game.update(dt, movement.horizontal, movement.vertical, movement.stealth);
  renderer.render(now);
  requestAnimationFrame(frame);
}

addEventListener("resize", () => renderer.resize());
requestAnimationFrame(frame);

if (import.meta.env.DEV)
  window.__liminal = {
    snapshot: () => ({
      player: game.player(),
      brother: game.brother(),
    }),
  };
