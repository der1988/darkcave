# Targeted editing map

Read only the modules relevant to the requested change.

- Room layout, doors, storefronts and decorative markings: `src/room.ts`
- Movement and companion doorway routing: `src/game.ts`
- Collision checks and world bounds: `src/movement.ts`
- 3D room geometry, fixtures and surface materials: `src/world-3d.ts`
- Light sources, attenuation and shared wall occlusion: `src/lighting.ts`
- Third-person camera, wall fading, light and pointer projection: `src/scene-renderer.ts`
- Stylized 3D characters and animation: `src/actors-3d.ts`
- Shared world point types: `src/geometry.ts`
- Camera, canvas sizing and frame composition: `src/scene-renderer.ts`
- Visual tuning: `src/config.ts`
- Computer lock, memory and exit state: `src/mechanisms.ts`
- Terminal, memory and exit meshes: `src/world-3d.ts`
- Clicker hearing, investigation and wandering: `src/clicker.ts`
- Grid navigation around walls and furniture: `src/navigation.ts`
- Dialogue timing and text: `src/dialogue.ts`
- Projected dialogue and interaction UI: `src/scene-renderer.ts`
- Throwable ownership, charged throws, physics and distraction sound: `src/throwables.ts`
- Throwable meshes, held objects and charge indicator: `src/scene-renderer.ts`
- Browser-safe footsteps, impact audio and spatial clicker calls: `src/footstep-audio.ts`
- Keyboard input: `src/input.ts`
- Startup wiring: `src/main.ts`

Use TypeScript only. Keep feature logic out of `main.ts`.
