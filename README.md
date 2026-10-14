# LIMINAL — TypeScript foundation

This is a deliberately small 2D platform foundation: a cutaway liminal house, two brothers, three connected floors and a handheld flashlight.

The complete simulation and renderer use TypeScript. There is no native compiler or WebAssembly layer.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

## Modular structure

Visual constants live in `src/config.ts`; the house layout lives in `src/house-world.ts`. Gameplay, flashlight behavior, rendering, actors and input remain separate TypeScript modules. `src/main.ts` only connects them.

`AGENTS.md` contains a task-to-file map so targeted changes can begin without loading unrelated source files.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

## Controls

- A / D or left / right: walk
- W / up: jump or climb up near a ladder
- S / down: climb down near a ladder
- Mouse: aim the flashlight in 360 degrees
- Space: physically stow or draw the flashlight
- F: switch the flashlight on or off while it is held
- Shift: silent stealth movement

The house is shown as a side-on cross-section with twelve distinct rooms, floor openings and two vertical connections.
