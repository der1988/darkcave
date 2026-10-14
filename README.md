# LIMINAL — TypeScript foundation

This is a deliberately small isometric foundation: three directly connected liminal spaces, two brothers, movement, stealth and daylight entering through one facade.

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

There is no corridor. The connected spaces draw from familiar liminal imagery: yellow repeating rooms, poolrooms and an empty office. All windows share one facade, so their parallel light comes from one sun or moon direction.
