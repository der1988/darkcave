# Targeted editing map

Read only the modules relevant to the requested change.

- Room layout, doors, storefronts and decorative markings: `src/room.ts`
- Movement and companion doorway routing: `src/game.ts`
- Collision checks and world bounds: `src/movement.ts`
- Floor and wall surface shading: `src/room-renderer.ts`
- Light sources, attenuation and shared wall occlusion: `src/lighting.ts`
- Character placement and illumination: `src/actor-renderer.ts`
- Character pixel art and animation: `src/player-sprite.ts`
- Isometric projection: `src/geometry.ts`
- Camera, canvas sizing and frame composition: `src/scene-renderer.ts`
- Visual tuning: `src/config.ts`
- Keyboard input: `src/input.ts`
- Startup wiring: `src/main.ts`

Use TypeScript only. Keep feature logic out of `main.ts`.
