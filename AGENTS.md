# Targeted editing map

Read only the modules relevant to the requested change.

- Room layout, doors, storefronts and decorative markings: `src/room.ts`
- Movement and companion doorway routing: `src/game.ts`
- Collision checks and world bounds: `src/movement.ts`
- Floor and wall surface shading: `src/room-renderer.ts`
- Light sources, attenuation and shared wall occlusion: `src/lighting.ts`
- Character placement, wall transparency and illumination: `src/actor-renderer.ts`
- Character pixel art and animation: `src/player-sprite.ts`
- Isometric projection: `src/geometry.ts`
- Camera, canvas sizing and frame composition: `src/scene-renderer.ts`
- Visual tuning: `src/config.ts`
- Computer lock, memory and exit state: `src/mechanisms.ts`
- Terminal, memory, exit and interaction hints: `src/mechanism-renderer.ts`
- Clicker hearing, investigation and wandering: `src/clicker.ts`
- Grid navigation around walls and furniture: `src/navigation.ts`
- Dialogue timing and text: `src/dialogue.ts`
- Character-anchored speech bubbles: `src/dialogue-renderer.ts`
- Throwable ownership, charged throws, physics and distraction sound: `src/throwables.ts`
- Ground objects, held items and charge indicator: `src/throwable-renderer.ts`
- Browser-safe footsteps, impact audio and spatial clicker calls: `src/footstep-audio.ts`
- Keyboard input: `src/input.ts`
- Startup wiring: `src/main.ts`

Use TypeScript only. Keep feature logic out of `main.ts`.
