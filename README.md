# LIMINAL — TypeScript foundation

This is a deliberately small isometric foundation: two six-room mall wings joined by a central memory room, two brothers, movement, stealth, interior penumbra and a handheld flashlight.

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
- E: use computer / collect memory / exit
- Click a nearby stone or bottle: pick up into the free hand
- Hold left mouse button and release: throw toward the cursor; holding longer increases power

The level follows the provided sketch: six rooms on each side and one memory bridge between them. Start in the upper-left room. The computer in the neighboring upper room opens the left memory door; use E nearby. The memory room leads directly into the right wing. Seven blind clickers occupy the marked danger rooms. The exit is in the upper-left room of the right wing. The disconnected areas above and below the bridge have no floor and cannot be crossed. Movement, light, sound routes and thrown objects share the locked door state.

Use E to collect the memory in the central room and to finish at the exit. Existing stones, bottles, stealth, dialogue and spatial creature audio remain available.

There are no windows or exterior light sources. Lighting is evaluated in world coordinates for each floor and wall texel: subtle ambient penumbra and a flashlight with soft angular edges, distance falloff and shared wall occlusion through doorway openings.

Short Italian exchanges appear above the speaking brother and move with him. Exchanges are less frequent during stealth. Each clicker starts in a marked room and wanders there until it hears footsteps. Walking produces quiet footstep audio and matching gameplay sound events; stealth produces neither. Hearing has a limited range and follows routes through doors. The clicker investigates the last heard position, searches briefly, then resumes wandering. It is visible only in the flashlight and has no attack/damage behavior in this phase.

Five loose stones and two empty bottles can be collected. One authoritative object state tracks ground, hand, flight and broken glass. Stones follow ballistic arcs, bounce, settle and can be recovered; bottles shatter on the first impact. Wall/furniture collisions and impacts emit gameplay sounds that can distract the blind clicker. Standing or moving in stealth creates no footstep events. After an unsuccessful search the creature chooses a patrol point away from its last heard position. Its original synthetic clicks and rasp are spatialized and audible even when it is hidden. Browser audio unlocks after the first keyboard/mouse gesture.
