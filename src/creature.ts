import { isSafe } from "./environments";
import { move, visible, geometryRevision } from "./world";
import type { Point } from "./light";
import { nearbyDestinations, pathfind } from "./navigation";
export type CreatureState =
  | "wandering"
  | "reacting"
  | "pursuing"
  | "remembering"
  | "searching";
export const creatureSpawn = { x: 53.5, y: 43.5 };
export class Creature {
  position = { ...creatureSpawn };
  state: CreatureState = "wandering";
  lastKnown: Point | null = null;
  heading = 0;
  stride = 0;
  speed = 0;
  stateTime = 0;
  private geometry = geometryRevision;
  private route: Point[] = [];
  private repath = 0;
  private pause = 2;
  private soundIn = 2.5;
  constructor(private random = Math.random) {}
  private enter(state: CreatureState) {
    this.state = state;
    this.stateTime = 0;
    this.route = [];
    this.repath = 0;
  }
  private destination(center: Point, radius: number) {
    const choices = nearbyDestinations(center, radius);
    for (let attempt = 0; attempt < 8; attempt++) {
      const target = choices[Math.floor(this.random() * choices.length)];
      if (
        !target ||
        isSafe(target.x, target.y) ||
        Math.hypot(target.x - this.position.x, target.y - this.position.y) < 1.5
      )
        continue;
      const route = pathfind(this.position, target, isSafe);
      if (route.length) {
        this.route = route;
        return;
      }
    }
  }
  /** The only player information accepted is a currently visible observation. */
  update(dt: number, observation: Point | null): boolean {
    if (observation && isSafe(observation.x, observation.y)) observation = null;
    if (this.geometry !== geometryRevision) {
      this.geometry = geometryRevision;
      this.route = [];
      this.repath = 0;
      this.pause = 0;
    }
    this.stateTime += dt;
    this.repath -= dt;
    this.soundIn -= dt;
    const vocalize = this.soundIn <= 0;
    if (vocalize) this.soundIn = 5 + this.random() * 7;
    if (observation) {
      this.lastKnown = { ...observation };
      if (this.state === "wandering" || this.state === "searching")
        this.enter("reacting");
      else if (this.state === "remembering") this.enter("pursuing");
      if (this.state === "reacting" && this.stateTime >= 0.65)
        this.enter("pursuing");
    } else if (this.state === "pursuing" || this.state === "reacting") {
      const route = this.route;
      this.enter("remembering");
      this.route = route;
    }
    if (this.state === "reacting" && this.lastKnown) {
      this.heading = Math.atan2(
        this.lastKnown.y - this.position.y,
        this.lastKnown.x - this.position.x,
      );
    }
    if (
      (this.state === "pursuing" || this.state === "remembering") &&
      this.lastKnown
    ) {
      if (
        this.state === "remembering" &&
        Math.hypot(
          this.lastKnown.x - this.position.x,
          this.lastKnown.y - this.position.y,
        ) < 0.2
      ) {
        this.enter("searching");
        this.pause = 1.6;
      } else if (this.repath <= 0) {
        // Only refresh a route when its destination changes cells, or the route ends.
        // Keeping existing waypoints avoids stepping back to cell centers on each refresh.
        const end = this.route.at(-1);
        if (
          !end ||
          Math.floor(end.x) !== Math.floor(this.lastKnown.x) ||
          Math.floor(end.y) !== Math.floor(this.lastKnown.y)
        )
          this.route = pathfind(this.position, this.lastKnown, isSafe);
        else this.route[this.route.length - 1] = { ...this.lastKnown };
        this.repath = 0.6;
        if (
          !this.route.length &&
          this.state === "remembering" &&
          this.stateTime > 4
        ) {
          this.enter("searching");
          this.pause = 1;
        }
      }
    }
    if (this.state === "searching") {
      if (this.stateTime > 11) {
        this.enter("wandering");
        this.lastKnown = null;
        this.pause = 1;
      } else {
        this.heading += dt * 0.7;
        if (!this.route.length) {
          this.pause -= dt;
          if (this.pause <= 0) {
            this.destination(this.lastKnown!, 4);
            this.pause = 1.2 + this.random();
          }
        }
      }
    }
    if (this.state === "wandering" && !this.route.length) {
      this.pause -= dt;
      if (this.pause <= 0) {
        this.destination(this.position, 13);
        this.pause = 1 + this.random() * 3;
      }
    }
    const targetSpeed = this.route.length
      ? this.state === "pursuing" || this.state === "remembering"
        ? 2.05
        : this.state === "searching"
          ? 0.85
          : 0.65
      : 0;
    this.speed += (targetSpeed - this.speed) * (1 - Math.exp(-dt * 3));
    const waypoint = this.route[0];
    if (waypoint) {
      const dx = waypoint.x - this.position.x,
        dy = waypoint.y - this.position.y,
        distance = Math.hypot(dx, dy);
      if (distance < 0.04) this.route.shift();
      else {
        const amount = Math.min(distance, this.speed * dt),
          x = this.position.x,
          y = this.position.y;
        move(
          this.position,
          (dx / distance) * amount,
          (dy / distance) * amount,
          isSafe,
        );
        this.stride += Math.hypot(this.position.x - x, this.position.y - y) * 5;
        this.heading = Math.atan2(dy, dx);
      }
    }
    return vocalize;
  }
  canCapture(player: Point): boolean {
    return (
      !isSafe(player.x, player.y) &&
      !isSafe(this.position.x, this.position.y) &&
      (this.state === "pursuing" || this.state === "remembering") &&
      Math.hypot(player.x - this.position.x, player.y - this.position.y) <
        0.36 &&
      visible(this.position.x, this.position.y, player.x, player.y)
    );
  }
}
