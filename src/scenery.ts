import { roomLight, type Furniture } from "./environments";
import { surfaceLight, type Lamp } from "./light";
type Vertex = [number, number, number];
type Polygon = (points: Vertex[], color: number[], light: number) => void;
/** Low, authored pixel geometry. All footprints are shared with collision/LOS. */
export function drawFurniture(f: Furniture, polygon: Polygon, lamp: Lamp) {
  const { w, d, h } = f;
  const x = f.x + (f.visualOffset?.[0] || 0),
    y = f.y + (f.visualOffset?.[1] || 0),
    oz = f.visualOffset?.[2] || 0;
  const light = Math.max(
    roomLight(x + w / 2, y + d / 2, 0.4),
    surfaceLight(lamp, x + w / 2, y + d + 0.01, 0.3, 0, 1),
  );
  const stone = [146, 145, 127],
    metal = [108, 119, 113],
    wood = [128, 117, 94],
    dark = [49, 56, 50],
    rust = [125, 99, 81];
  const clip = (
    points: Vertex[],
    axis: 0 | 1,
    boundary: number,
    greater: boolean,
  ): Vertex[] => {
    const result: Vertex[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        insideA = greater ? a[axis] >= boundary : a[axis] <= boundary,
        insideB = greater ? b[axis] >= boundary : b[axis] <= boundary;
      if (insideA) result.push(a);
      if (insideA !== insideB) {
        const t = (boundary - a[axis]) / (b[axis] - a[axis]);
        result.push([
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t,
        ]);
      }
    }
    return result;
  };
  const face = (v: Vertex[], c: number[], shade = 1) => {
    let points: Vertex[] = v.map((p) => [
      p[0],
      p[1],
      Math.max(0.005, p[2] + oz),
    ]);
    if (f.clip) points = clip(points, f.clip.axis, f.clip.minimum, true);
    if (f.cutout) {
      const r = f.cutout,
        middle = clip(clip(points, 0, r.x, true), 0, r.x + r.w, false);
      for (const part of [
        clip(points, 0, r.x, false),
        clip(points, 0, r.x + r.w, true),
        clip(middle, 1, r.y, false),
        clip(middle, 1, r.y + r.h, true),
      ])
        if (part.length >= 3) polygon(part, c, light * shade);
    } else if (points.length >= 3) polygon(points, c, light * shade);
  };
  const box = (
    a: number,
    b: number,
    ww: number,
    dd: number,
    z: number,
    hh: number,
    c: number[],
  ) => {
    face(
      [
        [a + ww, b, z],
        [a + ww, b + dd, z],
        [a + ww, b + dd, z + hh],
        [a + ww, b, z + hh],
      ],
      c,
      0.75,
    );
    face(
      [
        [a, b + dd, z],
        [a + ww, b + dd, z],
        [a + ww, b + dd, z + hh],
        [a, b + dd, z + hh],
      ],
      c,
      0.6,
    );
    face(
      [
        [a, b, z + hh],
        [a + ww, b, z + hh],
        [a + ww, b + dd, z + hh],
        [a, b + dd, z + hh],
      ],
      c,
    );
  };
  const post = (a: number, b: number, z: number, hh: number, c = metal) =>
    box(a, b, 0.07, 0.07, z, hh, c);
  // Contact shadow; the room's light never flattens the base into the floor.
  face(
    [
      [x + 0.08, y + 0.12, 0.005],
      [x + w + 0.08, y + 0.12, 0.005],
      [x + w + 0.08, y + d + 0.08, 0.005],
      [x + 0.08, y + d + 0.08, 0.005],
    ],
    [88, 87, 76],
    0.82,
  );
  if (f.kind === "shutter") {
    box(x + 0.08, y + 0.15, w - 0.16, 0.62, 0, h, metal);
    for (let z = 0.13; z < h - 0.12; z += 0.11)
      face(
        [
          [x + 0.15, y + 0.78, z],
          [x + w - 0.15, y + 0.78, z],
          [x + w - 0.15, y + 0.78, z + 0.025],
          [x + 0.15, y + 0.78, z + 0.025],
        ],
        dark,
        0.8,
      );
    box(x + 0.12, y + 0.1, w - 0.24, 0.72, h, 0.16, wood);
    // Blank sign, uneven remnants of old lettering.
    for (let i = 0.5; i < w - 0.4; i += 0.53)
      box(x + i, y + 0.825, 0.19, 0.015, h + 0.04, 0.035, stone);
    box(x + w / 2 - 0.1, y + 0.79, 0.2, 0.02, 0.08, 0.05, dark);
  } else if (f.kind === "bed") {
    box(x + 0.08, y + 0.08, w - 0.16, d - 0.16, 0.12, 0.16, wood);
    box(x + 0.12, y + 0.12, w - 0.24, d - 0.24, 0.28, 0.1, stone);
    box(x + 0.15, y + 0.18, w - 0.3, 0.48, 0.38, 0.12, [136, 128, 104]);
    box(x + 0.08, y + 0.05, w - 0.16, 0.08, 0.1, 0.58, dark);
  } else if (f.kind === "bench" || f.kind === "chair") {
    const along = w >= d,
      length = along ? w : d;
    for (const t of [0.22, length - 0.3])
      box(
        x + (along ? t : 0.18),
        y + (along ? 0.18 : t),
        along ? 0.1 : 0.58,
        along ? 0.58 : 0.1,
        0,
        h,
        metal,
      );
    for (let t = 0.12; t < 0.85; t += 0.22)
      box(
        x + (along ? 0.1 : t),
        y + (along ? t : 0.1),
        along ? w - 0.2 : 0.13,
        along ? 0.13 : d - 0.2,
        h,
        0.07,
        wood,
      );
    box(
      x + 0.1,
      y + 0.1,
      along ? w - 0.2 : 0.08,
      along ? 0.08 : d - 0.2,
      h + 0.08,
      0.28,
      wood,
    );
    if (f.kind === "chair")
      for (let t = 0.2; t < d; t += 0.65)
        box(x + 0.05, y + t, 0.75, 0.05, h + 0.1, 0.06, metal);
  } else if (f.kind === "planter") {
    box(x + 0.12, y + 0.12, w - 0.24, d - 0.24, 0, h, stone);
    box(x + 0.21, y + 0.21, w - 0.42, d - 0.42, h, 0.012, dark);
    post(x + 0.42, y + 0.45, h, 0.46, wood);
    post(x + 0.64, y + 0.54, h, 0.3, wood);
    face(
      [
        [x + 0.45, y + 0.48, h + 0.25],
        [x + 0.24, y + 0.34, h + 0.44],
        [x + 0.49, y + 0.5, h + 0.29],
      ],
      wood,
    );
  } else if (f.kind === "kiosk") {
    box(x + 0.18, y + 0.18, w - 0.36, d - 0.36, 0, h, wood);
    box(x + 0.08, y + 0.08, w - 0.16, d - 0.16, h, 0.065, stone);
    if (w > 1) {
      box(x + 0.25, y + 0.3, 0.3, 0.3, h + 0.065, 0.14, metal);
      box(x + 0.29, y + 0.34, 0.23, 0.09, h + 0.19, 0.25, dark);
    }
  } else if (f.kind === "fountain") {
    box(x + 0.08, y + 0.08, w - 0.16, d - 0.16, 0, 0.06, dark);
    box(x + 0.08, y + 0.08, w - 0.16, 0.18, 0, h, stone);
    box(x + 0.08, y + 0.08, 0.18, d - 0.16, 0, h, stone);
    box(x + w / 2 - 0.28, y + d / 2 - 0.28, 0.56, 0.56, 0.06, 0.42, stone);
    box(x + w / 2 - 0.055, y + d / 2 - 0.055, 0.11, 0.11, 0.48, 0.1, metal);
    box(x + 0.08, y + d - 0.26, w - 0.16, 0.18, 0, h, stone);
    box(x + w - 0.26, y + 0.08, 0.18, d - 0.16, 0, h, stone);
  } else if (f.kind === "swing") {
    // Two empty chain seats below a tired A-frame.
    for (const a of [x + 0.15, x + w - 0.22]) {
      face(
        [
          [a, y + 0.12, 0],
          [a + 0.09, y + 0.12, 0],
          [a + 0.09, y + d / 2, h],
          [a, y + d / 2, h],
        ],
        rust,
      );
      face(
        [
          [a, y + d - 0.12, 0],
          [a + 0.09, y + d - 0.12, 0],
          [a + 0.09, y + d / 2, h],
          [a, y + d / 2, h],
        ],
        rust,
        0.75,
      );
    }
    box(x + 0.1, y + d / 2 - 0.04, w - 0.2, 0.08, h, 0.07, rust);
    for (const a of [x + 1, x + 2.55]) {
      for (const t of [0, 0.55]) post(a + t, y + d / 2, 0.29, h - 0.29, metal);
      box(a - 0.04, y + d / 2 - 0.17, 0.68, 0.34, 0.24, 0.055, wood);
    }
  } else if (f.kind === "slide") {
    const a = x + 0.3,
      b = y + 0.35;
    post(a, b, 0, h, rust);
    post(a + w - 0.6, b, 0, h, rust);
    for (let z = 0.15; z < h; z += 0.2)
      box(a, b, w - 0.6, 0.055, z, 0.045, metal);
    box(a, b, w - 0.6, 0.5, h, 0.06, rust);
    face(
      [
        [a, b + 0.5, h],
        [a + w - 0.6, b + 0.5, h],
        [a + w - 0.6, y + d - 0.2, 0.12],
        [a, y + d - 0.2, 0.12],
      ],
      metal,
    );
    for (const t of [0, w - 0.67])
      face(
        [
          [a + t, b + 0.5, h],
          [a + t + 0.07, b + 0.5, h],
          [a + t + 0.07, y + d - 0.2, 0.12],
          [a + t, y + d - 0.2, 0.12],
        ],
        rust,
      );
  } else if (f.kind === "armchair" || f.kind === "sofa") {
    box(x + 0.12, y + 0.14, w - 0.24, d - 0.25, 0, 0.22, wood);
    box(x + 0.12, y + 0.12, w - 0.24, 0.22, 0.2, h - 0.2, rust);
    box(x + 0.1, y + 0.15, 0.18, d - 0.25, 0.2, 0.3, rust);
    box(x + w - 0.28, y + 0.15, 0.18, d - 0.25, 0.2, 0.3, rust);
    const count = f.kind === "sofa" ? 3 : 1;
    for (let i = 0; i < count; i++)
      box(
        x + 0.3 + (i * (w - 0.6)) / count,
        y + 0.38,
        (w - 0.6) / count - 0.03,
        d - 0.53,
        0.2,
        0.13,
        [137, 121, 104],
      );
  } else if (f.kind === "desk") {
    for (const a of [0.15, w - 0.22])
      for (const b of [0.15, d - 0.22]) post(x + a, y + b, 0, h, wood);
    box(x + 0.06, y + 0.06, w - 0.12, d - 0.12, h, 0.065, wood);
  } else if (f.kind === "cabinet" || f.kind === "shelf" || f.kind === "crate") {
    box(x + 0.1, y + 0.1, w - 0.2, d - 0.2, 0, h, wood);
    if (f.kind === "shelf") {
      for (const z of [0.2, 0.45, 0.7])
        if (z < h) box(x + 0.2, y + d - 0.09, w - 0.4, 0.015, z, 0.08, dark);
    } else
      for (let i = 0.5; i < w; i++)
        box(x + i, y + d - 0.09, 0.04, 0.02, 0.3, h * 0.5, dark);
  } else if (f.kind === "generator") {
    box(x + 0.15, y + 0.15, w - 0.3, d - 0.3, 0, 0.45, metal);
    for (let i = 0.3; i < 0.8; i += 0.12)
      box(x + i, y + d - 0.14, 0.045, 0.02, 0.12, 0.22, dark);
    box(x + 0.25, y + 0.25, 0.45, 0.4, 0.45, 0.08, rust);
  } else if (f.kind === "lamp") {
    box(x + 0.25, y + 0.25, 0.5, 0.5, 0, 0.05, metal);
    post(x + 0.48, y + 0.48, 0.05, h - 0.05, metal);
    box(x + 0.22, y + 0.22, 0.56, 0.56, h - 0.2, 0.25, stone);
  } else if (f.kind === "television") {
    box(x + 0.12, y + 0.17, w - 0.24, d - 0.34, 0, h, wood);
    box(
      x + 0.2,
      y + d - 0.16,
      w - 0.4,
      0.02,
      0.12,
      Math.max(0.12, h - 0.24),
      [82, 94, 83],
    );
    box(x + w - 0.24, y + d - 0.14, 0.05, 0.02, 0.16, 0.05, stone);
  } else if (
    f.kind === "window" ||
    f.kind === "curtain" ||
    f.kind === "hotel-door"
  ) {
    box(x + 0.05, y + 0.05, w - 0.1, 0.12, 0.05, h, wood);
    if (f.kind === "curtain")
      for (let i = 0.1; i < w; i += 0.14)
        box(x + i, y + 0.17, 0.08, 0.06, 0.1, h - 0.1, rust);
    else if (f.kind === "window") {
      box(x + 0.15, y + 0.18, w - 0.3, 0.02, 0.35, h - 0.45, [167, 163, 119]);
      box(x + w / 2, y + 0.2, 0.04, 0.02, 0.3, h - 0.4, wood);
    } else {
      box(x + 0.2, y + 0.18, 0.55, 0.02, 0.08, h - 0.14, rust);
      box(x + 0.3, y + 0.21, 0.25, 0.015, 0.8, 0.1, stone);
      box(x + 0.66, y + 0.21, 0.06, 0.03, 0.5, 0.05, metal);
    }
  } else if (f.kind === "roundabout") {
    const cx = x + w / 2,
      cy = y + d / 2,
      r = w * 0.43;
    const points: Vertex[] = Array.from({ length: 8 }, (_, i) => [
      cx + Math.cos((i * Math.PI) / 4) * r,
      cy + Math.sin((i * Math.PI) / 4) * r,
      0.14,
    ]);
    face(points, rust);
    box(cx - 0.11, cy - 0.11, 0.22, 0.22, 0.14, h + 0.1, metal);
    for (const t of [-0.8, 0.8]) {
      post(cx + t, cy, 0.14, h, metal);
      post(cx, cy + t, 0.14, h, metal);
    }
    box(cx - 0.85, cy - 0.03, 1.7, 0.06, h + 0.14, 0.055, metal);
    box(cx - 0.03, cy - 0.85, 0.06, 1.7, h + 0.14, 0.055, metal);
  }
}
