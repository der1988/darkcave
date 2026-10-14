import { ROOM, ROOMS, WALLS, WINDOWS, MARKINGS } from "./room";
import { project, traceSurface, type Point } from "./geometry";
import { illumination, type Flashlight, type Vec3 } from "./lighting";

/** Shade real floor/wall coordinates into a reusable texture, then project it.
 * Both light sources are evaluated at each texel, not drawn as screen overlays. */
export class RoomRenderer {
  private texture = document.createElement("canvas");
  private ctx = this.texture.getContext("2d")!;
  private colors = new Map<string, number[]>();
  private rgb(hex: string) {
    if (!this.colors.has(hex))
      this.colors.set(
        hex,
        [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
      );
    return this.colors.get(hex)!;
  }
  private surface(
    ctx: CanvasRenderingContext2D,
    camera: Point,
    origin: Vec3,
    u: Vec3,
    v: Vec3,
    albedo: (point: Vec3) => string,
    player: Point,
    torch: Flashlight,
  ) {
    const width = Math.ceil(Math.hypot(u.x, u.y, u.z) * 22);
    const height = Math.ceil(Math.hypot(v.x, v.y, v.z) * 22);
    this.texture.width = width;
    this.texture.height = height;
    const pixels = this.ctx.createImageData(width, height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const a = (x + 0.5) / width,
          b = (y + 0.5) / height;
        const point = {
          x: origin.x + u.x * a + v.x * b,
          y: origin.y + u.y * a + v.y * b,
          z: origin.z + u.z * a + v.z * b,
        };
        const base = this.rgb(albedo(point));
        const light = illumination(point, player, torch);
        const index = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          // Muted cool exterior and slightly warm flashlight, with restrained exposure.
          const tint = channel === 2 ? 0.95 : 1;
          pixels.data[index + channel] = Math.min(
            255,
            base[channel] * (0.38 + light * 1.8) * tint,
          );
        }
        pixels.data[index + 3] = 255;
      }
    this.ctx.putImageData(pixels, 0, 0);
    const p = project(origin.x, origin.y, origin.z);
    const pu = project(origin.x + u.x, origin.y + u.y, origin.z + u.z);
    const pv = project(origin.x + v.x, origin.y + v.y, origin.z + v.z);
    ctx.save();
    ctx.transform(
      (pu.x - p.x) / width,
      (pu.y - p.y) / width,
      (pv.x - p.x) / height,
      (pv.y - p.y) / height,
      p.x + camera.x,
      p.y + camera.y,
    );
    ctx.drawImage(this.texture, 0, 0);
    ctx.restore();
  }
  draw(
    ctx: CanvasRenderingContext2D,
    camera: Point,
    player: Point,
    torch: Flashlight,
  ) {
    const floorColor = (p: Vec3) => {
      const mark = [...MARKINGS]
        .reverse()
        .find(
          (m) =>
            p.x >= m.x &&
            p.x < m.x + m.width &&
            p.y >= m.y &&
            p.y < m.y + m.depth,
        );
      return (
        mark?.color ?? ROOMS.find((r) => p.x >= r.minX && p.x <= r.maxX)!.floor
      );
    };
    this.surface(
      ctx,
      camera,
      { x: 0, y: 0, z: 0 },
      { x: ROOM.width, y: 0, z: 0 },
      { x: 0, y: ROOM.height, z: 0 },
      floorColor,
      player,
      torch,
    );
    this.surface(
      ctx,
      camera,
      { x: 0, y: 0, z: 0 },
      { x: ROOM.width, y: 0, z: 0 },
      { x: 0, y: 0, z: ROOM.wallHeight },
      () => "#27332f",
      player,
      torch,
    );
    this.surface(
      ctx,
      camera,
      { x: 0, y: 0, z: 0 },
      { x: 0, y: ROOM.height, z: 0 },
      { x: 0, y: 0, z: ROOM.wallHeight },
      () => "#242d29",
      player,
      torch,
    );
    for (const window of WINDOWS) {
      traceSurface(
        ctx,
        [
          [window.from, 0, 0.43],
          [window.to, 0, 0.43],
          [window.to, 0, 1.13],
          [window.from, 0, 1.13],
        ],
        camera,
      );
      ctx.fillStyle = "#90aaa5";
      ctx.fill();
      ctx.strokeStyle = "#26332f";
      ctx.lineWidth = 2;
      ctx.stroke();
      const mid = (window.from + window.to) / 2;
      traceSurface(
        ctx,
        [
          [mid, 0, 0.43],
          [mid, 0, 1.13],
        ],
        camera,
      );
      ctx.stroke();
    }
    for (const wall of WALLS)
      this.surface(
        ctx,
        camera,
        { x: wall.position, y: wall.from, z: 0 },
        { x: 0, y: wall.to - wall.from, z: 0 },
        { x: 0, y: 0, z: ROOM.wallHeight },
        () => "#26312c",
        player,
        torch,
      );
  }
}
