export type ActorState = {
  x: number;
  y: number;
  heading: number;
  stride: number;
  moving: boolean;
};

type CoreExports = {
  reset(): void;
  update(dt: number, horizontal: number, vertical: number, running: number): void;
  player_x(): number;
  player_y(): number;
  player_heading(): number;
  player_stride(): number;
  player_moving(): number;
  brother_x(): number;
  brother_y(): number;
  brother_heading(): number;
  brother_stride(): number;
  brother_moving(): number;
  room_width(): number;
  room_height(): number;
};

export type NativeGame = {
  room: { width: number; height: number };
  update(dt: number, horizontal: number, vertical: number, running: boolean): void;
  player(): ActorState;
  brother(): ActorState;
};

export async function loadNativeGame(): Promise<NativeGame> {
  const response = await fetch("/liminal-core.wasm");
  if (!response.ok) throw new Error(`Unable to load C++ core: ${response.status}`);
  const module = await WebAssembly.instantiateStreaming(response);
  const core = module.instance.exports as unknown as CoreExports;
  core.reset();
  const actor = (prefix: "player" | "brother"): ActorState => ({
    x: core[`${prefix}_x`](),
    y: core[`${prefix}_y`](),
    heading: core[`${prefix}_heading`](),
    stride: core[`${prefix}_stride`](),
    moving: core[`${prefix}_moving`]() > 0.5,
  });
  return {
    room: { width: core.room_width(), height: core.room_height() },
    update: (dt, horizontal, vertical, running) =>
      core.update(dt, horizontal, vertical, running ? 1 : 0),
    player: () => actor("player"),
    brother: () => actor("brother"),
  };
}
