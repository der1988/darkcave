import { move, type Point } from "./world";

export class Companion {
  position: Point;
  heading = 0;
  stride = 0;
  moving = false;

  constructor(position: Point) {
    this.position = { ...position };
  }

  update(dt: number, leader: Point, running: boolean) {
    const dx = leader.x - this.position.x;
    const dy = leader.y - this.position.y;
    const distance = Math.hypot(dx, dy);
    const desiredGap = 0.52;
    this.moving = false;
    if (distance <= desiredGap) return;

    const speed = running ? 3.2 : 2.35;
    const step = Math.min(distance - desiredGap, speed * dt);
    const before = { ...this.position };
    move(this.position, (dx / distance) * step, (dy / distance) * step);
    const travelled = Math.hypot(
      this.position.x - before.x,
      this.position.y - before.y,
    );
    if (travelled > 0) {
      this.heading = Math.atan2(dy, dx);
      this.stride += travelled * 8;
      this.moving = true;
    }
  }
}
