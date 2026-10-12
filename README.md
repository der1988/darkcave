# LIMINAL

A solitary walk through abandoned, isometric architecture. A small figure, a warm flashlight, and almost absolute darkness. No objectives, enemies, interface, or soundtrack.

## Play and develop

Requires Node.js 22.12+ (validated on Node 24) and npm.

```sh
npm ci
npm run dev
```

- **WASD / arrows:** move relative to the screen
- **Mouse:** aim the flashlight independently of walking
- **Shift:** walk slightly faster
- **F:** switch the flashlight on or off

The canvas fills the browser viewport. Click the scene if keyboard focus is elsewhere. Desktop keyboard and mouse are required; the canvas resizes to narrow displays, but touch movement is not implemented.

```sh
npm test
npm run build
npm run preview
```

## Architecture

TypeScript and Vite, with a dependency-free Canvas 2D game renderer. The logical framebuffer is scaled with nearest-neighbor sampling. Geometry uses a fixed 2:1 projection. A seventeen-pixel character has directional poses, alternating legs, a hand-held lamp, and movement bob. Frame-independent movement uses a circular collision body, subdivided steps, and axis sliding. The camera eases behind the player.

`src/world.ts` contains the authored modular map, grid ray traversal, collision, and projection math. The connected level includes an arrival hall, columned atria, oversized galleries, repeating waiting rooms, a southern loop, and dead ends. Floor material variations are deterministic. The module layout can later be replaced or extended without changing the renderer.

`src/main.ts` samples warm directional light separately on small floor and wall patches. Angular penumbra, distance falloff, surface incidence, and a small local light determine brightness. Grid DDA rays stop at opaque walls and columns, including closed corners. Nothing is revealed beyond a blocked ray. Solid walls are treated as full-height occluders; this is a 2.5D lighting model, not a full 3D ray tracer. Camera-facing wall faces, caps, and the character are depth ordered. Unlit wall geometry still occludes what is behind it. Scan-converted polygons avoid antialiased tile seams. There is no transparent cone overlay, bloom, or circular reveal mask.

## Validation

`npm test` checks that every walkable cell belongs to the connected level, walls and columns block light, large movement steps cannot tunnel through columns, and projection conversions preserve screen-relative controls.

The prototype was also exercised in headless Chromium: movement and architectural rendering were visually inspected; flashlight toggling, portrait resizing without overflow, and absence of browser errors were checked. The measured frame interval was approximately 16.7 ms on the development machine, not a guarantee for every device.

For a manual smoke test, sweep the light across the arrival hall columns, walk north into the narrowing passage, hold movement against a wall, toggle F, and resize the browser. Objects behind a column must remain dark and the character must remain outside solid geometry.

## Vercel

This is a static Vite application. The existing repository remote is preserved. `vercel.json` specifies `npm run build` and the `dist` output directory. No backend, secrets, runtime APIs, or external assets are needed. The connected Vercel project must use this repository's root directory. An actual deployment must be checked separately; a successful local production build does not establish that Vercel has deployed it.

## Scope

One authored level, with no procedural expansion, audio, touch controls, save system, combat, or puzzles. Surface lighting has intentionally low-resolution shading and hard architectural shadows. The game starts directly in the scene without instructions or menus.
