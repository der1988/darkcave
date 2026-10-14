export const VIEW = {
  isoX: 32,
  isoY: 16,
  isoZ: 32,
  cameraY: 24,
  minWidth: 320,
  minHeight: 180,
  resolutionScale: 0.5,
} as const;

export const LIGHT = {
  initialAngle: -Math.PI / 4,
  initialRange: 4,
  minRange: 0.4,
  maxRange: 16,
  coneWidth: 0.82,
  edgeFade: 0.35,
  layers: 14,
} as const;

export const ROOM_STYLE = {
  background: "#030506",
  floor: "#0b0d0e",
  backWall: "#101314",
  sideWall: "#0e1112",
  wallHeight: 1.35,
} as const;
