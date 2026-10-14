# LIMINAL — C++ foundation

This is a deliberately small playable foundation: one clean isometric room, two brothers, movement and a handheld flashlight.

The authoritative simulation lives in `native/game.cpp` and is compiled to a self-contained WebAssembly module. TypeScript only connects browser input, the canvas renderer and the C++ exports.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

The local C++ toolchain is supplied by `@live-codes/clang-wasm`; no system compiler is required.

## Modular structure

Visual constants live in `src/config.ts`. Flashlight behavior, room rendering, actor rendering, pixel sprites, input, geometry and camera composition each have a separate module. `src/main.ts` only connects them. Gameplay simulation remains isolated in `native/game.cpp`.

`AGENTS.md` contains a task-to-file map so targeted changes can begin without loading unrelated source files.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

`npm run build:native` recompiles `native/game.cpp` into `public/liminal-core.wasm`.

## Controls

- WASD / arrow keys: move
- Mouse: aim the flashlight and set its reach on the floor
- Space: physically stow or draw the flashlight
- F: switch the flashlight on or off while it is held
- Shift: move faster

The room uses continuous surfaces with restrained ambient visibility and a small reusable set of abandoned furnishings. The flashlight combines a warm hotspot, a broad corona and weak local spill, with wall and solid-occluder ray tests. Its world-space origin is the visible lens, and it follows mouse aim with slight inertia and movement sway. The protagonist does not cast a projected shadow; the younger brother and room props cast one only while illuminated.
