import { FootstepAudio } from "./footstep-audio";
import "./style.css";
import { InputState } from "./input";
import { createGame } from "./game";
import { SceneRenderer } from "./scene-renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const game = createGame();
const renderer = new SceneRenderer(canvas, game);
const input = new InputState(
  () => renderer.torch.toggle(),
  () => game.interact(),
);
canvas.addEventListener("pointermove", (event) =>
  renderer.aim(event.clientX, event.clientY),
);
const footstepAudio = new FootstepAudio();
addEventListener("keydown", () => footstepAudio.unlock());
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  footstepAudio.unlock();
  renderer.aim(event.clientX, event.clientY);
  if (renderer.clickComputer(event.clientX, event.clientY)) return;
  if (game.heldObject()) {
    game.beginThrow();
    canvas.setPointerCapture(event.pointerId);
  } else renderer.pickUpAt(event.clientX, event.clientY);
});
canvas.addEventListener("pointerup", (event) => {
  if (event.button !== 0) return;
  renderer.aim(event.clientX, event.clientY);
  game.releaseThrow(renderer.torch.angle);
});
canvas.addEventListener("pointercancel", () => game.cancelThrow());
addEventListener("blur", () => game.cancelThrow());
let lastFrame = performance.now();

function frame(now: number) {
  const dt = Math.min(0.04, (now - lastFrame) / 1000);
  lastFrame = now;
  const movement = input.movement();
  game.update(dt, movement.horizontal, movement.vertical, movement.stealth);
  footstepAudio.play(game.takeFootsteps());
  footstepAudio.impacts(game.takeImpacts(), game.player());
  game
    .clickers()
    .forEach((clicker, index) =>
      footstepAudio.clicker(dt, clicker, game.player(), index),
    );
  renderer.render(now);
  requestAnimationFrame(frame);
}

addEventListener("resize", () => renderer.resize());
requestAnimationFrame(frame);

if (import.meta.env.DEV)
  window.__liminal = {
    advance: (dt, horizontal, vertical, stealth) =>
      game.update(dt, horizontal, vertical, stealth),
    screenPoint: (x, y, z) => renderer.screenPoint(x, y, z),
    snapshot: () => ({
      player: game.player(),
      brother: game.brother(),
      torchOn: renderer.torch.on,
      clicker: game.clicker(),
      clickers: game.clickers(),
      progress: game.progress(),
      dialogue: game.dialogue(),
      objects: game.objects(),
      heldObject: game.heldObject(),
      chargePower: game.chargePower(),
    }),
  };
