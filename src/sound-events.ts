import type { Point } from "./light";
import { visible } from "./world";
export type Noise = {
  source: string;
  position: Point;
  category: "step" | "drop" | "mechanism" | "furniture" | "generator";
  intensity: number;
  range: number;
  timestamp: number;
};
export class SoundEvents {
  events: Noise[] = [];
  emit(
    source: string,
    position: Point,
    category: Noise["category"],
    intensity: number,
    range: number,
    time: number,
  ) {
    this.events.push({
      source,
      position: { ...position },
      category,
      intensity,
      range,
      timestamp: time,
    });
    if (this.events.length > 64) this.events.shift();
  }
  prune(time: number) {
    this.events = this.events.filter((e) => time - e.timestamp < 1);
  }
  heard(listener: Point, sensitivity: number, after: number) {
    return this.events
      .filter(
        (e) =>
          e.timestamp > after &&
          Math.hypot(listener.x - e.position.x, listener.y - e.position.y) <
            e.range *
              sensitivity *
              (visible(listener.x, listener.y, e.position.x, e.position.y)
                ? 1
                : 0.22),
      )
      .sort(
        (a, b) => b.timestamp - a.timestamp || b.intensity - a.intensity,
      )[0];
  }
}
