# LIMINAL — TypeScript foundation

This is a deliberately small isometric foundation: one room, two brothers, movement, stealth and daylight entering through windows.

The complete simulation and renderer use TypeScript. There is no native compiler or WebAssembly layer.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

## Modular structure

Visual constants live in `src/config.ts`; the single room lives in `src/room.ts`. Gameplay, window lighting, actors and input remain separate TypeScript modules. `src/main.ts` only connects them.

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

The current scene intentionally contains one room with two windows. Their slowly shifting daylight and character shadows provide the only illumination.
