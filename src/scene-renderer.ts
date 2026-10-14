import { drawMechanisms } from "./mechanism-renderer";
import { drawThrowables, drawHeldObject } from "./throwable-renderer";
import { actorOpacity } from "./actor-renderer";
import { illumination } from "./lighting";
import { ROOM_STYLE, VIEW } from "./config";
import type { Game } from "./game";
import { project, type Point } from "./geometry";
import { COMPUTER } from "./room";
import { RoomRenderer } from "./room-renderer";
import { Flashlight } from "./lighting";
import { drawDialogue } from "./dialogue-renderer";
import { drawActors, drawClicker } from "./actor-renderer";

/** Canvas sizing, fixed isometric camera, and frame composition only. */
export class SceneRenderer {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  private camera: Point = { x: 0, y: 0 };
  private surfaces = new RoomRenderer();
  readonly torch = new Flashlight();

  constructor(
    readonly canvas: HTMLCanvasElement,
    private game: Game,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;

    this.resize();
  }

  resize() {
    this.width = Math.max(
      VIEW.minWidth,
      Math.ceil(innerWidth * VIEW.resolutionScale),
    );
    this.height = Math.max(
      VIEW.minHeight,
      Math.ceil(innerHeight * VIEW.resolutionScale),
    );
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
    const player = this.game.player();
    const center = project(player.x, player.y);
    this.camera.x = Math.round(this.width / 2 - center.x);
    this.camera.y = Math.round(this.height / 2 - center.y + 25);
  }

  aim(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const sx =
      ((clientX - rect.left) / rect.width) * this.width - this.camera.x;
    const sy =
      ((clientY - rect.top) / rect.height) * this.height - this.camera.y;
    const player = this.game.player();
    const x = sx / (2 * VIEW.isoX) + sy / (2 * VIEW.isoY);
    const y = sy / (2 * VIEW.isoY) - sx / (2 * VIEW.isoX);
    this.torch.angle = Math.atan2(y - player.y, x - player.x);
  }

  pickUpAt(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.width,
      y = ((clientY - rect.top) / rect.height) * this.height;
    const item = this.game
      .objects()
      .filter(
        (item) =>
          item.state === "ground" &&
          actorOpacity(item, this.game.progress().doorOpen) === 1 &&
          illumination({ ...item, z: 0 }, this.game.player(), this.torch) >
            0.15,
      )
      .sort((a, b) => {
        const pa = project(a.x, a.y),
          pb = project(b.x, b.y);
        return (
          Math.hypot(pa.x + this.camera.x - x, pa.y + this.camera.y - y) -
          Math.hypot(pb.x + this.camera.x - x, pb.y + this.camera.y - y)
        );
      })[0];
    if (!item) return false;
    const p = project(item.x, item.y);
    if (Math.hypot(p.x + this.camera.x - x, p.y + this.camera.y - y) > 9)
      return false;
    return this.game.pickUp(item.id);
  }

  private followCamera() {
    const player = this.game.player(),
      center = project(player.x, player.y);
    const targetX = this.width / 2 - center.x,
      targetY = this.height / 2 - center.y + VIEW.cameraY;
    this.camera.x += (targetX - this.camera.x) * 0.12;
    this.camera.y += (targetY - this.camera.y) * 0.12;
  }

  clickComputer(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.width,
      y = ((clientY - rect.top) / rect.height) * this.height;
    const screen = project(COMPUTER.x, COMPUTER.y, 0.53);
    if (
      Math.hypot(screen.x + this.camera.x - x, screen.y + this.camera.y - y) >
      16
    )
      return false;
    return this.game.interact();
  }

  screenPoint(x: number, y: number, z = 0) {
    const p = project(x, y, z),
      rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + ((p.x + this.camera.x) / this.width) * rect.width,
      y: rect.top + ((p.y + this.camera.y) / this.height) * rect.height,
    };
  }

  render(now: number) {
    this.followCamera();
    this.ctx.fillStyle = ROOM_STYLE.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.torch.unlocked = this.game.progress().doorOpen;
    this.surfaces.draw(this.ctx, this.camera, this.game.player(), this.torch);
    drawMechanisms(
      this.ctx,
      this.camera,
      this.game,
      this.torch,
      this.width,
      this.height,
    );
    drawThrowables(this.ctx, this.camera, this.game, this.torch);
    drawClicker(this.ctx, this.camera, this.game, this.torch);
    drawActors(this.ctx, this.camera, this.game, this.torch, now);
    drawHeldObject(this.ctx, this.camera, this.game);
    drawDialogue(this.ctx, this.camera, this.game, this.width);
  }
}
