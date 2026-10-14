# Targeted editing map

Read only the modules relevant to the requested change.

- Room layout, doors, windows and decorative markings: `src/room.ts`
- Movement and companion doorway routing: `src/game.ts`
- Collision checks and world bounds: `src/movement.ts`
- Floor and wall rendering: `src/room-renderer.ts`
- Window light, character shading and shadows: `src/window-lighting.ts`
- Character pixel art and animation: `src/player-sprite.ts`
- Isometric projection: `src/geometry.ts`
- Camera, canvas sizing and frame composition: `src/scene-renderer.ts`
- Visual tuning: `src/config.ts`
- Keyboard input: `src/input.ts`
- Startup wiring: `src/main.ts`

Use TypeScript only. Keep feature logic out of `main.ts`.
