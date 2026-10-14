import { LIGHT } from "./config";
import type { Point } from "./geometry";

export type LightBounds = { width: number; height: number };
export type LightOccluder = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};
export type LightMotion = { stride: number; moving: boolean };

const smooth = (value: number) => value * value * (3 - 2 * value);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function rayBox(origin: Point, dx: number, dy: number, box: LightOccluder) {
  let near = 0;
  let far = Infinity;
  for (const [position, direction, low, high] of [
    [origin.x, dx, box.minX, box.maxX],
    [origin.y, dy, box.minY, box.maxY],
  ] as const) {
    if (Math.abs(direction) < 0.00001) {
      if (position < low || position > high) return Infinity;
      continue;
    }
    const first = (low - position) / direction;
    const second = (high - position) / direction;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return Infinity;
  }
  return near >= 0 ? near : Infinity;
}

export class Flashlight {
  on = true;
  brightness = 1;
  held = true;
  holdProgress = 1;
  private baseAngle = LIGHT.initialAngle;
  private desiredAngle = LIGHT.initialAngle;
  private actualRange: number = LIGHT.initialRange;
  private desiredRange: number = LIGHT.initialRange;
  private motionAngle = 0;
  private occluders: LightOccluder[] = [];

  get angle() {
    return this.baseAngle + this.motionAngle;
  }

  set angle(value: number) {
    this.baseAngle = value;
    this.desiredAngle = value;
    this.motionAngle = 0;
  }

  get range() {
    return this.actualRange;
  }

  set range(value: number) {
    this.actualRange = value;
    this.desiredRange = value;
  }

  toggle() {
    if (!this.held) return false;
    this.on = !this.on;
    return this.on;
  }

  toggleHeld() {
    this.held = !this.held;
    if (!this.held) this.on = false;
    else this.on = true;
    return this.held;
  }

  origin(actor: Point): Point {
    const reach = LIGHT.lensForwardOffset * this.holdProgress;
    return {
      x: actor.x + Math.cos(this.angle) * reach,
      y: actor.y + Math.sin(this.angle) * reach,
    };
  }

  setOccluders(occluders: LightOccluder[]) {
    this.occluders = occluders;
  }

  aim(target: Point) {
    const distance = Math.hypot(target.x, target.y);
    if (distance <= 0.04) return;
    this.desiredAngle = Math.atan2(target.y, target.x);
    this.desiredRange = Math.max(
      LIGHT.minRange,
      Math.min(LIGHT.maxRange, distance),
    );
  }

  update(dt: number, motion: LightMotion, running: boolean, time: number) {
    const heldTarget = this.held ? 1 : 0;
    this.holdProgress += Math.sign(heldTarget - this.holdProgress) *
      Math.min(Math.abs(heldTarget - this.holdProgress), dt / LIGHT.stowDuration);
    const angleDelta = Math.atan2(
      Math.sin(this.desiredAngle - this.baseAngle),
      Math.cos(this.desiredAngle - this.baseAngle),
    );
    this.baseAngle += angleDelta * (1 - Math.exp(-LIGHT.aimResponse * dt));
    this.actualRange +=
      (this.desiredRange - this.actualRange) *
      (1 - Math.exp(-LIGHT.rangeResponse * dt));

    const movementSway = motion.moving
      ? Math.sin(motion.stride * 0.92) *
        (running ? LIGHT.runSway : LIGHT.walkSway)
      : 0;
    const idleSway =
      (Math.sin(time * 1.37) + Math.sin(time * 2.11 + 0.8) * 0.38) *
      LIGHT.idleSway;
    const targetSway = movementSway + idleSway;
    this.motionAngle += (targetSway - this.motionAngle) * (1 - Math.exp(-8 * dt));

    const targetBrightness = this.on && this.held ? this.holdProgress : 0;
    const response = this.on ? 36 : 80;
    this.brightness +=
      (targetBrightness - this.brightness) * (1 - Math.exp(-response * dt));
  }

  power(distance = this.range) {
    const attenuation = 1 / (1 + 0.028 * distance * distance);
    return this.brightness * (0.3 + attenuation * 1.18);
  }

  beamRadius(distance: number) {
    return 0.08 + Math.tan((LIGHT.mainBeamDegrees * Math.PI) / 360) * distance;
  }

  effectiveRange(origin: Point, bounds?: LightBounds, ignored?: LightOccluder) {
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    let result = this.range;
    if (bounds) {
      const walls = [
        dx > 0 ? (bounds.width - origin.x) / dx : dx < 0 ? -origin.x / dx : Infinity,
        dy > 0 ? (bounds.height - origin.y) / dy : dy < 0 ? -origin.y / dy : Infinity,
      ];
      result = Math.min(result, ...walls.filter((distance) => distance >= 0));
    }
    for (const occluder of this.occluders) {
      if (occluder === ignored) continue;
      result = Math.min(result, rayBox(origin, dx, dy, occluder));
    }
    return result;
  }

  target(origin: Point, bounds?: LightBounds): Point {
    const range = this.effectiveRange(origin, bounds);
    return {
      x: origin.x + Math.cos(this.angle) * range,
      y: origin.y + Math.sin(this.angle) * range,
    };
  }

  spotRadius(range = this.range) {
    return this.beamRadius(range) * LIGHT.coronaScale;
  }

  at(point: Point, origin: Point, bounds?: LightBounds, ignored?: LightOccluder) {
    if (this.brightness < 0.01) return 0;
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const forward = dx * Math.cos(this.angle) + dy * Math.sin(this.angle);
    const hitRange = this.effectiveRange(origin, bounds, ignored);
    if (forward < 0 || forward > hitRange + 0.05) return 0;
    const lateral = Math.abs(-dx * Math.sin(this.angle) + dy * Math.cos(this.angle));
    const mainRadius = this.beamRadius(Math.max(0.1, forward));
    const coronaRadius = mainRadius * LIGHT.coronaScale;
    if (lateral >= coronaRadius) return 0;
    const corona = 1 - smooth(clamp01(lateral / coronaRadius));
    const hotspot = 1 - smooth(clamp01(lateral / (mainRadius * LIGHT.hotspotScale)));
    const impact = 1 - clamp01(Math.abs(hitRange - forward) / 0.45);
    return this.power(forward) * (corona * 0.28 + hotspot * 0.58 + impact * corona * 0.22);
  }

  reaches(point: Point, origin: Point, bounds?: LightBounds, threshold = 0.08) {
    return this.at(point, origin, bounds) >= threshold;
  }
}
