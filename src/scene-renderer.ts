import { ROOM_STYLE, VIEW } from "./config";
import type { Game } from "./game";
import { project, type Point } from "./geometry";
import { ROOM } from "./room";
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
    const center = project(ROOM.width / 2, ROOM.height / 2);
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

  render(now: number) {
    this.ctx.fillStyle = ROOM_STYLE.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.surfaces.draw(this.ctx, this.camera, this.game.player(), this.torch);
    drawClicker(this.ctx, this.camera, this.game, this.torch);
    drawActors(this.ctx, this.camera, this.game, this.torch, now);
    drawDialogue(this.ctx, this.camera, this.game, this.width);
  }
}
