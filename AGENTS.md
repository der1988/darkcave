# Targeted editing map

Read only the files relevant to the requested change, then expand scope if a dependency requires it.

- Movement, collisions, room size, companion following: `native/game.cpp`
- Global visual tuning values: `src/config.ts`
- Flashlight aim, range and intensity math: `src/flashlight.ts`
- Floor, walls and environmental light: `src/room-renderer.ts`
- Character placement, illumination and brother shadow: `src/actor-renderer.ts`
- Character pixel art and animation: `src/player-sprite.ts`
- Isometric projection helpers: `src/geometry.ts`
- Keyboard state: `src/input.ts`
- Camera and frame composition: `src/scene-renderer.ts`
- Startup and browser event wiring: `src/main.ts`
- Flashlight switch audio: `src/switch-sound.ts`
- Reusable furniture data and light occluders: `src/room-props.ts`
- Furniture geometry, depth and shadows: `src/prop-renderer.ts`
- WebAssembly bridge: `src/native.ts`
- Native compiler pipeline: `scripts/build-native.mjs`

`public/liminal-core.wasm` is generated. Never edit it directly. After changing C++, run `npm run build:native`. Keep feature logic out of `main.ts`; it should only connect modules.
