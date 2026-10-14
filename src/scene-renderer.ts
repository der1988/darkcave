import { ROOM_STYLE, VIEW } from "./config";
import type { Game } from "./game";
import { project, type Point } from "./geometry";
import { ROOM } from "./room";
import { drawRoom } from "./room-renderer";
import { WindowLighting } from "./window-lighting";

/** Canvas sizing, fixed isometric camera, and frame composition only. */
export class SceneRenderer {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  private camera: Point = { x: 0, y: 0 };
  private lighting: WindowLighting;

  constructor(
    readonly canvas: HTMLCanvasElement,
    game: Game,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.lighting = new WindowLighting(this.ctx, this.camera, game);
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

  render(now: number) {
    this.ctx.fillStyle = ROOM_STYLE.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    drawRoom(this.ctx, this.camera);
    const light = this.lighting.daylight(now);
    this.lighting.drawActors(now, light);
  }
}
