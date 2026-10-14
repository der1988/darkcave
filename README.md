# LIMINAL — TypeScript foundation

This is a deliberately small playable foundation: one clean isometric room, two brothers, movement and a handheld flashlight.

The complete simulation and renderer use TypeScript. There is no native compiler or WebAssembly layer.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

## Modular structure

Visual constants live in `src/config.ts`. Gameplay, flashlight behavior, room rendering, actors, input and geometry each have a small TypeScript module. `src/main.ts` only connects them.

`AGENTS.md` contains a task-to-file map so targeted changes can begin without loading unrelated source files.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

## Controls

- WASD / arrow keys: move
- Mouse: aim the flashlight and set its reach on the floor
- Space: physically stow or draw the flashlight
- F: switch the flashlight on or off while it is held
- Shift: move faster

The room contains one true cube. Its shadow is the convex perspective projection of all eight cube vertices from the flashlight lens onto the floor, with a narrow penumbra around the exact geometric core.
