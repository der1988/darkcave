# Targeted editing map

Read only the files relevant to the requested change, then expand scope if a dependency requires it.

- Movement, collisions, room size, companion following: `src/game.ts`
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

The project uses TypeScript only. Keep feature logic out of `main.ts`; it should only connect modules.
