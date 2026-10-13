import type { Point } from "./light";
import type { Gait } from "./movement";
import { canStand, move, geometryRevision, visible } from "./world";
import { pathfind } from "./navigation";
export class Companion {
  position: Point;
  heading = 0;
  stride = 0;
  walking = false;
  gait: Gait = "walk";
  private history: Point[] = [];
  private route: Point[] = [];
  private repath = 0;
  private geometry = -1;
  constructor(p: Point) {
    this.position = { ...p };
  }
  reset(p: Point) {
    this.position = { ...p };
    this.history = [];
    this.route = [];
    this.repath = 0;
    this.walking = false;
  }
  update(
    dt: number,
    leader: Point,
    gait: Gait,
    leaderMoving: boolean,
    threats: Point[] = [],
  ) {
    const last = this.history.at(-1);
    if (!last || Math.hypot(last.x - leader.x, last.y - leader.y) > 0.18) {
      this.history.push({ ...leader });
      if (this.history.length > 180) this.history.shift();
    }
    const distance = Math.hypot(
        this.position.x - leader.x,
        this.position.y - leader.y,
      ),
      gap = gait === "silent" ? 0.34 : 0.46;
    this.gait = gait;
    this.walking = false;
    this.repath -= dt;
    const exposed =
      !leaderMoving &&
      threats.some(
        (t) =>
          visible(t.x, t.y, this.position.x, this.position.y) &&
          !visible(t.x, t.y, leader.x, leader.y),
      );
    const together = visible(
      this.position.x,
      this.position.y,
      leader.x,
      leader.y,
    );
    if (distance < gap && together && !exposed) {
      this.route = [];
      return false;
    }
    // Follow the leader's recent route; at rest close the gap to share their cover.
    let target = { ...leader },
      travel = 0;
    if (exposed) {
      const cover: Point[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
          p = {
            x: leader.x + Math.cos(a) * 0.6,
            y: leader.y + Math.sin(a) * 0.6,
          };
        if (
          canStand(p.x, p.y) &&
          visible(leader.x, leader.y, p.x, p.y) &&
          threats.every((t) => !visible(t.x, t.y, p.x, p.y))
        )
          cover.push(p);
      }
      cover.sort(
        (a, b) =>
          Math.hypot(a.x - this.position.x, a.y - this.position.y) -
          Math.hypot(b.x - this.position.x, b.y - this.position.y),
      );
      if (cover[0]) target = cover[0];
    }
    if (leaderMoving)
      for (let i = this.history.length - 1; i > 0; i--) {
        travel += Math.hypot(
          this.history[i].x - this.history[i - 1].x,
          this.history[i].y - this.history[i - 1].y,
        );
        target = this.history[i - 1];
        if (travel > gap) break;
      }
    if (
      this.repath <= 0 ||
      this.geometry !== geometryRevision ||
      !this.route.length
    ) {
      const end = this.route.at(-1);
      if (
        !end ||
        Math.floor(end.x) !== Math.floor(target.x) ||
        Math.floor(end.y) !== Math.floor(target.y) ||
        this.geometry !== geometryRevision
      ) {
        this.route = pathfind(this.position, target);
        if (
          this.route[1] &&
          visible(
            this.position.x,
            this.position.y,
            this.route[1].x,
            this.route[1].y,
          )
        )
          this.route.shift();
      }
      this.repath = 0.45;
      this.geometry = geometryRevision;
      if (!this.route.length) this.route = pathfind(this.position, leader);
    }
    while (
      this.route[0] &&
      Math.hypot(
        this.route[0].x - this.position.x,
        this.route[0].y - this.position.y,
      ) < 0.06
    )
      this.route.shift();
    const next = this.route[0];
    if (!next) return false;
    const dx = next.x - this.position.x,
      dy = next.y - this.position.y,
      n = Math.hypot(dx, dy);
    const speed =
      gait === "silent"
        ? 0.72
        : gait === "run"
          ? 2.58
          : distance > 2
            ? 2.35
            : 2.05;
    const step = Math.min(
      n,
      speed * dt,
      exposed || !together ? Infinity : Math.max(0, distance - gap * 0.9),
    );
    const old = { ...this.position },
      phase = Math.floor(this.stride / Math.PI);
    move(this.position, (dx / n) * step, (dy / n) * step);
    const moved = Math.hypot(this.position.x - old.x, this.position.y - old.y);
    if (moved > 0.0001) {
      this.heading = Math.atan2(dy, dx);
      this.walking = true;
      this.stride += moved * 7.5;
    } else this.repath = 0;
    return this.walking && Math.floor(this.stride / Math.PI) !== phase;
  }
  static validNear(p: Point) {
    for (const d of [
      { x: -0.8, y: 0 },
      { x: 0, y: 0.8 },
      { x: 0.8, y: 0 },
      { x: 0, y: -0.8 },
    ])
      if (canStand(p.x + d.x, p.y + d.y)) return { x: p.x + d.x, y: p.y + d.y };
    const route = pathfind(p, { x: 40.5, y: 50.5 });
    return route[1] || { ...p };
  }
}
