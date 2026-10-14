import { ROOM, ROOMS, WALLS, MARKINGS, STOREFRONTS, FIXTURES } from "./room";
import { project, type Point } from "./geometry";
import { illumination, type Flashlight, type Vec3 } from "./lighting";

/** Shade real floor/wall coordinates into a reusable texture, then project it.
 * Ambient fill and flashlight are evaluated at each texel, not drawn as screen overlays. */
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
          // Restrained penumbra and a slightly warm flashlight.
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
        mark?.color ??
        ROOMS.find(
          (r) =>
            p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY,
        )!.floor
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
      (p) => {
        const shop = STOREFRONTS.find((s) => p.x >= s.from && p.x <= s.to);
        if (!shop) return "#323832";
        if (p.z > 1.08 && p.z < 1.27) return shop.sign;
        if (p.z > 1.02) return "#323832";
        if (p.x < shop.from + 0.07 || p.x > shop.to - 0.07) return shop.trim;
        if (p.z < 0.07) return "#151b19";
        // Fine horizontal ribs give closed shutters their familiar mall silhouette.
        return Math.floor(p.z * 24) % 2 ? "#343a35" : "#2b302c";
      },
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
    const shopColor = (p: Vec3) => {
      const shop = STOREFRONTS.find((s) => p.x >= s.from && p.x <= s.to);
      if (!shop) return "#323832";
      if (p.z > 1.08 && p.z < 1.27) return shop.sign;
      if (p.z > 1.02) return "#323832";
      if (p.x < shop.from + 0.07 || p.x > shop.to - 0.07) return shop.trim;
      return Math.floor(p.z * 24) % 2 ? "#343a35" : "#2b302c";
    };
    const objects = [
      ...WALLS.map((wall) => ({
        depth: wall.position + wall.to,
        draw: () => {
          this.surface(
            ctx,
            camera,
            {
              x: wall.axis === "x" ? wall.position : wall.from,
              y: wall.axis === "x" ? wall.from : wall.position,
              z: 0,
            },
            {
              x: wall.axis === "y" ? wall.to - wall.from : 0,
              y: wall.axis === "x" ? wall.to - wall.from : 0,
              z: 0,
            },
            { x: 0, y: 0, z: ROOM.wallHeight },
            wall.axis === "y" ? shopColor : () => "#26312c",
            player,
            torch,
          );
        },
      })),
      ...FIXTURES.map((prop) => ({
        depth: prop.x + prop.y + prop.width + prop.depth,
        draw: () => {
          const material = (p: Vec3) => {
            if (prop.kind === "planter" && p.z > prop.height - 0.08)
              return "#263c2e";
            if (
              (prop.kind === "directory" || prop.kind === "kiosk") &&
              p.z > 0.16 &&
              p.z < prop.height - 0.07
            )
              return "#1d292b";
            if (prop.kind === "display" && p.z > 0.12) return "#25383b";
            return prop.color;
          };
          this.surface(
            ctx,
            camera,
            { x: prop.x, y: prop.y, z: prop.height },
            { x: prop.width, y: 0, z: 0 },
            { x: 0, y: prop.depth, z: 0 },
            material,
            player,
            torch,
          );
          this.surface(
            ctx,
            camera,
            { x: prop.x + prop.width, y: prop.y, z: 0 },
            { x: 0, y: prop.depth, z: 0 },
            { x: 0, y: 0, z: prop.height },
            material,
            player,
            torch,
          );
          this.surface(
            ctx,
            camera,
            { x: prop.x, y: prop.y + prop.depth, z: 0 },
            { x: prop.width, y: 0, z: 0 },
            { x: 0, y: 0, z: prop.height },
            material,
            player,
            torch,
          );
        },
      })),
    ];
    objects
      .sort((a, b) => a.depth - b.depth)
      .forEach((object) => object.draw());
  }
}
