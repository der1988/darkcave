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
  initialRange: 6,
  minRange: 0.4,
  maxRange: 11,
  mainBeamDegrees: 30,
  coronaScale: 1.55,
  hotspotScale: 0.38,
  localSpillRadius: 1.2,
  aimResponse: 11,
  rangeResponse: 15,
  walkSway: 0.012,
  runSway: 0.022,
  idleSway: 0.0025,
  beamSamples: 10,
  lensForwardOffset: 0.2,
  stowDuration: 0.24,
  lensHeight: 0.48,
} as const;

export const ROOM_STYLE = {
  background: "#040607",
  floor: "#030404",
  backWall: "#050706",
  sideWall: "#040605",
  edge: "rgba(75, 84, 80, .055)",
  wallHeight: 1.35,
} as const;
