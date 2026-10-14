# LIMINAL — TypeScript foundation

This is a deliberately small isometric foundation: three directly connected liminal spaces, two brothers, movement, stealth, fixed directional daylight and a handheld flashlight.

The complete simulation and renderer use TypeScript. There is no native compiler or WebAssembly layer.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

## Modular structure

Visual constants live in `src/config.ts`; the house layout, walls, doors and windows live in `src/room.ts`. Gameplay, window lighting, actors and input remain separate TypeScript modules. `src/main.ts` only connects them.

`AGENTS.md` contains a task-to-file map so targeted changes can begin without loading unrelated source files.

## Checks

```sh
npm test
npm run build
npm run test:browser
```

## Controls

- WASD / arrow keys: move in the isometric room
- Shift: silent stealth movement
- Mouse: aim flashlight
- Space / F: toggle flashlight

There is no corridor. The connected spaces draw from familiar liminal imagery: yellow repeating rooms, poolrooms and an empty office. All windows share one facade, so their parallel light comes from one sun or moon direction.

Lighting is evaluated in world coordinates for each floor and wall texel. Both sources use the same wall occlusion, including doorway openings. Exterior direction is fixed; window height and frames determine the floor footprint. Flashlight intensity has a soft angular edge, distance falloff and a slight downward pitch.
