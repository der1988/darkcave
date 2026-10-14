import type { ActorState } from "./game";
import type { Point } from "./geometry";
import { move } from "./movement";
import { findPath } from "./navigation";

import type { SoundEvent } from "./throwables";
export type Footstep = Point & { source: "player" | "brother" };
export type ClickerState = ActorState & {
  mode: "wandering" | "investigating" | "searching";
  lastHeard: Point | null;
};
const PATROL = [
  { x: 8.5, y: 7.7 },
  { x: 7.4, y: 6.4 },
  { x: 8.6, y: 5.5 },
  { x: 7, y: 7.7 },
];
export class Clicker {
  private actor: ClickerState = {
    x: 8.5,
    y: 7.7,
    heading: 0,
    stride: 0,
    moving: false,
    stealth: false,
    mode: "wandering",
    lastHeard: null,
  };
  private route: Point[] = [];
  private patrol = 0;
  private wait = 1.5;
  snapshot(): ClickerState {
    return {
      ...this.actor,
      lastHeard: this.actor.lastHeard ? { ...this.actor.lastHeard } : null,
    };
  }
  hear(step: SoundEvent) {
    const strength = step.loudness ?? 1;
    if (
      Math.hypot(step.x - this.actor.x, step.y - this.actor.y) >
      7.5 * strength
    )
      return false;
    const route = findPath(this.actor, step);
    let distance = 0,
      previous: Point = this.actor;
    for (const point of route) {
      distance += Math.hypot(point.x - previous.x, point.y - previous.y);
      previous = point;
    }
    // Sound travels through openings: long routes around walls are too quiet.
    if (!route.length || distance > 8 * strength) return false;
    this.actor.lastHeard = { x: step.x, y: step.y };
    this.actor.mode = "investigating";
    this.route = route;
    this.wait = 0;
    return true;
  }
  update(dt: number) {
    this.actor.moving = false;
    if (this.wait > 0) {
      this.wait -= dt;
      return;
    }
    if (!this.route.length) {
      if (this.actor.mode === "investigating") {
        this.actor.mode = "searching";
        this.wait = 3;
        return;
      }
      this.actor.mode = "wandering";
      const lastHeard = this.actor.lastHeard;
      this.actor.lastHeard = null;
      if (lastHeard) {
        this.patrol = PATROL.reduce(
          (best, point, index) =>
            Math.hypot(point.x - lastHeard.x, point.y - lastHeard.y) >
            Math.hypot(
              PATROL[best].x - lastHeard.x,
              PATROL[best].y - lastHeard.y,
            )
              ? index
              : best,
          0,
        );
      } else this.patrol = (this.patrol + 1) % PATROL.length;
      this.route = findPath(this.actor, PATROL[this.patrol]);
    }
    const target = this.route[0];
    if (!target) return;
    const dx = target.x - this.actor.x,
      dy = target.y - this.actor.y,
      distance = Math.hypot(dx, dy);
    if (distance < 0.04) {
      this.route.shift();
      return;
    }
    const step = Math.min(
      distance,
      (this.actor.mode === "investigating" ? 0.95 : 0.45) * dt,
    );
    const travel = move(
      this.actor,
      (dx / distance) * step,
      (dy / distance) * step,
    );
    this.actor.heading = Math.atan2(dy, dx);
    this.actor.stride += travel * 8;
    this.actor.moving = travel > 0.001;
  }
}
