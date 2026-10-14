import { VIEW } from "./config";
import type { ActorState, Game } from "./game";
import { drawPerson } from "./player-sprite";
import { ROOM, WINDOWS } from "./room";
import {
  project,
  traceSurface,
  type Point,
  type SurfacePoint,
} from "./geometry";

/** Shared outdoor source, window footprints, and character shading. */
export class WindowLighting {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private camera: Point,
    private game: Game,
  ) {}
  private path(points: SurfacePoint[]) {
    traceSurface(this.ctx, points, this.camera);
  }
  daylight(now: number) {
    const phase = now * 0.000075,
      drift = 0.34 + Math.sin(phase) * 0.16,
      intensity = 0.78 + Math.sin(phase * 0.63 + 0.8) * 0.12,
      depth = 2.82;
    for (const window of WINDOWS) {
      const bottom = 0.43,
        top = 1.13;
      this.path([
        [window.from, 0, bottom],
        [window.to, 0, bottom],
        [window.to, 0, top],
        [window.from, 0, top],
      ]);
      const wallGlow = this.ctx.createLinearGradient(
        0,
        this.camera.y - 20,
        0,
        this.camera.y + 45,
      );
      wallGlow.addColorStop(0, `rgba(178,205,202,${0.72 * intensity})`);
      wallGlow.addColorStop(1, `rgba(113,145,143,${0.46 * intensity})`);
      this.ctx.fillStyle = wallGlow;
      this.ctx.fill();
      this.ctx.strokeStyle = "rgba(25,35,34,.85)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      const middle = (window.from + window.to) / 2;
      this.path([
        [middle, 0, bottom],
        [middle, 0, top],
      ]);
      this.ctx.stroke();
      const floorFrom = window.from + 0.08,
        floorTo = window.to - 0.08;
      this.path([
        [floorFrom, 0, 0.02],
        [floorTo, 0, 0.02],
        [floorTo + drift, depth, 0.02],
        [floorFrom + drift, depth, 0.02],
      ]);
      const start = project(middle, 0, 0),
        end = project(middle + drift, depth, 0),
        beam = this.ctx.createLinearGradient(
          start.x + this.camera.x,
          start.y + this.camera.y,
          end.x + this.camera.x,
          end.y + this.camera.y,
        );
      beam.addColorStop(0, `rgba(177,203,195,${0.27 * intensity})`);
      beam.addColorStop(0.72, `rgba(145,172,165,${0.16 * intensity})`);
      beam.addColorStop(1, "rgba(118,146,140,.02)");
      this.ctx.save();
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.fillStyle = beam;
      this.ctx.fill();
      this.ctx.restore();
    }
    return { drift, intensity, depth };
  }
  illumination(
    actor: ActorState,
    light: { drift: number; intensity: number; depth: number },
  ) {
    if (actor.y < 0 || actor.y > light.depth) return 0.34;
    const travel = actor.y / light.depth;
    for (const window of WINDOWS) {
      const from = window.from + 0.08 + light.drift * travel,
        to = window.to - 0.08 + light.drift * travel;
      if (actor.x >= from - 0.12 && actor.x <= to + 0.12)
        return 0.52 + light.intensity * 0.48;
    }
    return 0.38;
  }
  drawShadow(
    actor: ActorState,
    light: { drift: number; intensity: number; depth: number },
  ) {
    if (this.illumination(actor, light) < 0.6) return;
    const awayX = light.drift * 0.22,
      awayY = 0.42,
      length = actor.stealth ? 0.38 : 0.55;
    const base = project(actor.x, actor.y, 0.005),
      tip = project(actor.x + awayX * length, actor.y + awayY * length, 0.005);
    this.ctx.beginPath();
    this.ctx.moveTo(base.x + this.camera.x - 3, base.y + this.camera.y);
    this.ctx.lineTo(base.x + this.camera.x + 3, base.y + this.camera.y);
    this.ctx.lineTo(tip.x + this.camera.x + 2, tip.y + this.camera.y);
    this.ctx.lineTo(tip.x + this.camera.x - 2, tip.y + this.camera.y);
    this.ctx.closePath();
    this.ctx.fillStyle = `rgba(0,0,0,${0.34 * light.intensity})`;
    this.ctx.fill();
  }
  drawActors(
    now: number,
    light: { drift: number; intensity: number; depth: number },
  ) {
    const player = this.game.player(),
      brother = this.game.brother();
    this.drawShadow(brother, light);
    this.drawShadow(player, light);
    for (const [actor, child] of [
      [brother, true],
      [player, false],
    ] as const) {
      const p = project(actor.x, actor.y);
      drawPerson(
        this.ctx,
        Math.round(p.x + this.camera.x),
        Math.round(p.y + this.camera.y),
        actor.heading,
        actor.stride,
        child,
        this.illumination(actor, light),
        now / 1000,
        actor.moving,
        undefined,
        0,
        actor.stealth,
      );
    }
  }
}
