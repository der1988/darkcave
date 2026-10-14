# LIMINAL — TypeScript foundation

This is a deliberately small isometric foundation: one empty room, two brothers, movement and a handheld flashlight.

The complete simulation and renderer use TypeScript. There is no native compiler or WebAssembly layer.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

## Modular structure

Visual constants live in `src/config.ts`; the single room lives in `src/room.ts`. Gameplay, flashlight behavior, rendering, actors and input remain separate TypeScript modules. `src/main.ts` only connects them.

`AGENTS.md` contains a task-to-file map so targeted changes can begin without loading unrelated source files.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

## Controls

- WASD / arrow keys: move in the isometric room
- Mouse: aim the flashlight in 360 degrees
- Space: physically stow or draw the flashlight
- F: switch the flashlight on or off while it is held
- Shift: silent stealth movement

The current scene intentionally contains only one empty room so movement, scale and light can be refined before adding content.
