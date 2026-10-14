import { drawActors } from "./actor-renderer";
import { ROOM_STYLE, VIEW } from "./config";
import type { Flashlight } from "./flashlight";
import { project, type Camera } from "./geometry";
import type { Game } from "./game";
import { drawRoom } from "./room-renderer";
import { drawProps } from "./prop-renderer";

export class SceneRenderer {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  get room() {
    return this.game.room;
  }

  constructor(
    readonly canvas: HTMLCanvasElement,
    private game: Game,
    private flashlight: Flashlight,
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
  }

  render(now: number) {
    this.ctx.fillStyle = ROOM_STYLE.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    const player = this.game.player();
    const brother = this.game.brother();
    const center = project(player.x, player.y);
    const camera: Camera = {
      x: this.width / 2 - center.x,
      y: this.height / 2 - center.y + VIEW.cameraY,
    };
    drawRoom(
      this.ctx,
      this.game.room,
      player,
      this.flashlight,
      camera,
      this,
    );
    drawProps(this.ctx, player, this.flashlight, camera, this.game.room, player.x + player.y);
    drawActors(
      this.ctx,
      player,
      brother,
      this.flashlight,
      camera,
      now,
      this.game.room,
    );
    drawProps(this.ctx, player, this.flashlight, camera, this.game.room, null);
  }
}
