# LIMINAL

A small human in near-total darkness. A heartbeat, footsteps, and something moving in the architecture. The flashlight reveals the way—and can reveal the player to the creature.

## Play

Requires Node.js 22.12+ (validated on Node 24) and npm.

```sh
npm ci
npm run dev
```

- **WASD / arrows:** screen-relative movement
- **Mouse:** aim independently of movement
- **Shift:** walk faster
- **Space:** toggle the flashlight (F is no longer bound)

Audio initializes after a keypress or click, respecting browser autoplay restrictions. Headphones help distinguish the creature's direction. The canvas fills the viewport; desktop keyboard and mouse are required. The interface consists only of a small portrait, BPM readout, and synchronized heartbeat trace.

Illuminate the creature and it reacts, then pursues. Switch off the light or break line of sight and move away: it follows the last position it saw, searches nearby, then returns to wandering. A concealed player is not detected merely by proximity. Physical contact during pursuit—including pursuit of the last known position—causes a rapid final heartbeat, fade, silence, and an automatic restart. Contact during wandering or searching does not cause capture.

## Systems

The existing TypeScript/Vite Canvas renderer, fixed 2:1 projection, authored level, wall geometry, collision, and smooth camera remain in place. No production dependencies, external assets, services, or credentials are required.

- `world.ts`: the connected authored architecture, grid visibility, circular collision, and projection.
- `light.ts`: the shared directional beam, range falloff, wall occlusion, and tiny local illumination. The creature's rendering and exposure detection use this beam, without the ambient term. Turning off the flashlight leaves the surroundings black and the protagonist barely perceptible.
- `main.ts`: integration and depth-sorted pixel rendering. The nineteen-pixel protagonist has articulated limbs and directional poses. Reflected surface light shades the body asymmetrically. The thirty-eight-pixel creature reacts, turns, and walks irregularly; it is hidden outside the beam.
- `navigation.ts` / `creature.ts`: cardinal grid pathfinding, independent patrol, reaction, pursuit, remembered-position pursuit, timed local search, and return to wandering. The AI accepts only an optional currently visible player observation. It copies that position and cannot access a hidden player's coordinates for navigation. Collision remains active while following waypoints.
- `heart.ts`: one smooth BPM/phase simulation drives beat events, waveform timing, and the HUD value. Fear comes from visible danger, actual playing and audible creature voices, and decaying memory of an encounter. Lower-intensity sounds cannot indefinitely preserve pursuit-level fear.
- `audio.ts`: synthesized muffled double heartbeats, alternating footfalls tied to animation distance, and irregular layered creature vocalizations. Creature voices pan in projected screen space, attenuate with distance, and become quieter and low-pass filtered through walls. Voices clean up after playback; audio and simulation pause on focus loss. No music or downloaded samples.
- `hud.ts`: restrained pixel portrait, BPM, and a waveform sampled from the same beat simulation as the audio.

## Validation

```sh
npm test
npm run build
npm run preview
npm run test:browser
```

The browser suite requires Chromium. It uses `/usr/bin/chromium` when available, accepts `CHROMIUM_PATH`, or uses Playwright's installed browser (`npx playwright install chromium`). It starts and stops its own Vite server on port 5174. Playwright is a development-only dependency.

The unit suite covers map connectivity, projection, beam occlusion, collisions, long independent patrols, pathfinding around columns, detection/reaction, immutable last-known positions, search timeout, heart-rate response and recovery, waveform timing, spatial attenuation, and capture eligibility.

The browser suite exercises actual keyboard controls, audio activation and non-silent heartbeat output, synchronized footstep events, light toggling without key-repeat, removal of F, visible detection, a successful dark escape, search and return to patrol, capture and spawn reset, wall-blocked detection, audible warnings, and narrow-viewport scaling. A development-only scenario harness enables deterministic placement; Vite removes it from production builds.

Manual listening and playtesting remain useful for judging sound character, volume balance, and difficulty across headphones and hardware. The automated audio check establishes signal generation, not subjective audio quality.

## Vercel and scope

`vercel.json` retains the static Vite deployment: build with `npm run build`, serve `dist`, use the repository root. A successful local build does not establish deployment status.

This remains one authored level with one creature. No combat, procedural expansion, save system, touch controls, or soundtrack. Lighting and sound occlusion use the existing 2.5D grid: sound is attenuated through walls, not acoustically simulated around corridors. Character illumination approximates reflected light rather than full global illumination.
