import { LIGHT } from "./config";
import type { Point } from "./geometry";

export class Flashlight {
  angle: number = LIGHT.initialAngle;
  range: number = LIGHT.initialRange;
  on: boolean = true;

  toggle() {
    this.on = !this.on;
  }

  aim(target: Point) {
    const distance = Math.hypot(target.x, target.y);
    if (distance <= 0.04) return;
    this.angle = Math.atan2(target.y, target.x);
    this.range = Math.max(LIGHT.minRange, Math.min(LIGHT.maxRange, distance));
  }

  power() {
    const distance = Math.max(0, Math.min(1, (this.range - 0.5) / 15.5));
    return 1.45 - distance * distance * 0.95;
  }

  at(point: Point, origin: Point) {
    if (!this.on) return 0;
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this.range) return 0;
    const pointAngle = Math.atan2(dy, dx);
    const difference = Math.abs(
      Math.atan2(
        Math.sin(pointAngle - this.angle),
        Math.cos(pointAngle - this.angle),
      ),
    );
    const lateral = Math.max(0, 1 - difference / LIGHT.coneWidth);
    const edge = Math.min(1, Math.max(0, (this.range - distance) / LIGHT.edgeFade));
    return this.power() * lateral * lateral * edge;
  }
}
