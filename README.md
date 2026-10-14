# LIMINAL — TypeScript foundation

This is a deliberately small isometric foundation: three directly connected liminal spaces, two brothers, movement, stealth, interior penumbra and a handheld flashlight.

The complete simulation and renderer use TypeScript. There is no native compiler or WebAssembly layer.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

## Modular structure

Visual constants live in `src/config.ts`; the mall layout, walls, doors and storefronts live in `src/room.ts`. Gameplay, flashlight lighting, actors and input remain separate TypeScript modules. `src/main.ts` only connects them.

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

There is no corridor. Three directly connected rooms share an empty shopping mall theme: entrance, closed storefronts and a deserted food court. Floor inlays, blank signboards and ribbed shutters are deliberately restrained and proportionate to the brothers.

There are no windows or exterior light sources. Lighting is evaluated in world coordinates for each floor and wall texel: subtle ambient penumbra and a flashlight with soft angular edges, distance falloff and shared wall occlusion through doorway openings.
