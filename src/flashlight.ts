import { LIGHT } from "./config";
import type { Point } from "./geometry";

export type LightBounds = { width: number; height: number };

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

  power(range = this.range) {
    const distance = Math.max(0, Math.min(1, (range - 0.5) / 15.5));
    return 1.45 - distance * distance * 0.95;
  }

  effectiveRange(origin: Point, bounds?: LightBounds) {
    if (!bounds) return this.range;
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    const distances = [
      dx > 0 ? (bounds.width - origin.x) / dx : dx < 0 ? -origin.x / dx : Infinity,
      dy > 0 ? (bounds.height - origin.y) / dy : dy < 0 ? -origin.y / dy : Infinity,
    ].filter((distance) => distance >= 0);
    return Math.min(this.range, ...distances);
  }

  target(origin: Point, bounds?: LightBounds): Point {
    const range = this.effectiveRange(origin, bounds);
    return {
      x: origin.x + Math.cos(this.angle) * range,
      y: origin.y + Math.sin(this.angle) * range,
    };
  }

  spotRadius(range = this.range) {
    return LIGHT.spotBaseRadius + range * LIGHT.spotGrowth;
  }

  at(point: Point, origin: Point, bounds?: LightBounds) {
    if (!this.on) return 0;
    const range = this.effectiveRange(origin, bounds);
    const target = this.target(origin, bounds);
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    const radius = this.spotRadius(range);
    if (distance >= radius) return 0;
    const normalized = distance / radius;
    const smooth = normalized * normalized * (3 - 2 * normalized);
    return this.power(range) * (1 - smooth);
  }
}
