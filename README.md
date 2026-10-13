# LIMINAL

A small human in unfamiliar architecture. A flashlight, a heartbeat, and something moving beyond the beam. Objects now have a physical cost: what you carry changes your stride, your available hands, and your ability to see.

## Run

Node.js 22.12+ and npm (validated on Node 24):

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:browser
```

`npm run preview` serves the production build. Browser acceptance tests start their own Vite server on port 5174. They use `/usr/bin/chromium`, `CHROMIUM_PATH`, or Playwright's installed Chromium (`npx playwright install chromium`). No backend, runtime network requests, secrets, or downloaded game assets are required.

## Controls

Press **H** for the in-game reference, generated from the same control configuration as input.

- WASD / arrows: move relative to the screen
- Mouse: aim
- Space: toggle requested flashlight state
- E: pick up / interact / use a compatible carried item
- I / Tab: inventory
- C: character and equipment
- Shift: faster movement when the load and hands permit
- H: toggle Help
- Escape: close the current screen

Keyboard or pointer interaction enables audio. Menus pause player movement, creature AI, heartbeat simulation, and audio together. Click an item to inspect it and use its contextual actions. A close-by illuminated object gets one small E hint; darkness does not reveal object names or the creature.

## Playable transport route

The arrival area contains a service key, transfer slip, backpack, battery, and water. The slip describes the route. Look around with the flashlight to discover them.

Travel through the long eastern gallery into the **Service Areas**. Tools and a self-contained clip lamp are on the service-room floor. Equip the lamp in **Utility** to keep the flashlight available with both hands occupied. A battery opens the service cabinet; its cargo harness supports a compact equipment case. An equipped maintenance tool opens the maintenance compartment.

Use the service key at **S-04**, then carry the electrical module out of the store. It cannot go in a bag. It occupies both hands, appears on the character, reduces walking speed, and prevents faster movement. Without a clip lamp, the handheld beam is unavailable; drop the module through inventory to free your hands. Space preserves the requested light state, so freeing a hand restores a requested beam. Dark-adapted vision reveals only nearby large architecture, never the creature.

Carry the module through the connecting rooms to the **Underground**. Install it in the inactive drive machine beside the southern shutter. The module moves into the machine's ownership and the shutter opens into another underground chamber. This is a transport example, not a final story objective.

The original light-driven stealth loop remains: expose the creature, break the beam, leave the last observed position, and let its search expire. Cargo is not a new detection channel. Capture returns the player to arrival while preserving items, equipment, and mechanism progress.

## Inventory and persistence

One stable-ID item record owns exactly one location: world, inventory, equipment slot, storage, or installed/consumed target. Transfers validate weight, bulk, hands, slot compatibility, and capacity before committing. Equipment remains part of carried weight. Backpacks add capacity only while equipped; removing one is rejected if its contents would exceed the remaining capacity. Large cargo is always visibly carried, stored, installed, or on the floor.

Dropped cargo and fixtures share the collision/occlusion grid used by the player, flashlight, and creature. Dropping checks actor collision radii; a box cannot be placed inside the player or creature. Geometry changes invalidate AI routes. If a remembered location becomes inaccessible, the creature performs a bounded search rather than pursuing forever.

Local saves use `liminal.transport.v1`, a versioned format with a map revision. Position, requested light state, every item's location, storage, equipment, and activated mechanisms are saved after interactions, on menu entry, periodically while moving, and on page exit. Loading validates known IDs, definitions, ownership, equipment, capacities, positions, and consumption/mechanism consistency. Incompatible or damaged data falls back to a clean session. Storage denial/quota failure leaves the session playable and is reported in the management interface. No AI pursuit or search state is saved; reloading initializes a safe patrol location.

## Architecture

The existing TypeScript/Vite Canvas renderer, 2:1 projection, logical pixel scale, handcrafted map, collision system, camera, heartbeat, and procedural audio are retained.

- `world.ts`, `zones.ts`: connected floor modules, zone palettes, dynamic obstruction revision, projection and collision.
- `light.ts`: directional, geometry-aware beam plus faint short-range, occluded architectural ambient shading. Creature rendering and detection use only the beam.
- `items.ts`: definitions, capabilities, equipment compatibility, stable instances, fixtures, and item-to-target rules.
- `possessions.ts`: authoritative ownership, transactional transfers, weight/bulk/hand constraints, interaction eligibility, serialization and validation.
- `controls.ts`, `menu.ts`: shared keyboard configuration and Help; inventory, categories, contextual actions, storage, and equipment panels.
- `player-sprite.ts`: the same nineteen-pixel character in the world and enlarged equipment view, with breathing, turning, restrained walking, lifting posture, and visible equipment/cargo.
- `navigation.ts`, `creature.ts`: layout-aware patrol, exposure reaction, pursuit, last-known navigation, search, and forgetting.
- `heart.ts`, `audio.ts`, `hud.ts`: perceived-danger BPM, synchronized audio/trace, spatial creature voices, surface-dependent footsteps, object handling, and mechanical sounds. Sounds queued by paused inventory actions play when the menu closes.
- `main.ts`: integration and depth-ordered scene rendering.

## Validation and scope

Unit tests cover existing stealth behavior plus item conservation, rollback, storage, equipment conflicts, weight penalties, body lighting, dark interaction rules, the complete collision-checked module route, opened passage connectivity, corrupted save rejection, blocked AI memories, and safe drops near actor boundaries.

Chromium acceptance tests exercise the real controls and menus: Help freezes/resumes gameplay; pickups disappear into inventory; dropping/retrieving works; equipment renders; two-handed cargo disables the handheld beam; the clip lamp restores it; key unlocking, installation, and reload preserve progress. They also retain the earlier audio signal, footstep, pursuit, dark escape, capture/reset, and narrow-viewport checks. Development-only placement tools stage browser scenarios; the unit transport test physically traverses the complete route using the game's movement and collision code. These tools are absent from production builds.

Phases 1–4 are implemented for this representative vertical slice: inventory/equipment, physical cargo, three connected zones and a complete delivery, followed by animation/audio polish and local persistence. Further content, broader equipment choices, touch controls, drag-and-drop, stack merging, and a final narrative/objective remain future work. Items currently use individual stable instances (quantity one); click-based actions are the supported interface. Geometry and sound occlusion remain conservative 2.5D approximations; hearing balance and cargo difficulty benefit from manual headphone playtesting.

## Vercel

`vercel.json` retains the static Vite configuration: build with `npm run build`, serve `dist`, repository root as project root. Successful local tests/builds do not establish the status of a Vercel deployment.

## Explored map and illuminated stages

Open **I / Tab → Map** to consult a persistent plan of nearby space already seen while walking. Unknown rooms and passages stay black; the map shows your position and marks discovered lit cells in green. It never displays creatures, loot, or undiscovered zone names. Map, inventory, equipment, and Help share the same pause/resume behavior.

The western atrium is now **The Empty Mall**, with closed shop shutters, a vacant kiosk, dry fountain, benches, and dead planters. Its northern corridor leads to **The Forgotten Playground**, an empty indoor play hall with swings, a slide, and a roundabout. A smaller lit **Waiting Annex** branches from the west side of arrival. These spaces are connected to the existing yellow rooms, service areas, and underground without loading screens. Fixed overhead lighting reveals their muted materials even with the flashlight off; adjoining corridors retain the original darkness.

For now, lit rooms are safe from creatures. `environments.ts` supplies the shared room bounds for lighting and AI exclusion. Patrol, chase, search, physical movement, and capture all respect those bounds; safe rooms provide no player observation to the creature. This rule concerns fixed environmental lighting, not the handheld flashlight. Furniture footprints participate in player collision, beam occlusion, and navigation. `scenery.ts` draws the authored furnishings using the existing pixel projection.

`exploration.ts` records nearby, unobstructed floor cells and renders only remembered space. Save format **2** adds explored cells while retaining the existing `liminal.transport.v1` storage key. Valid version-1 saves migrate with inventory, equipment, mechanisms, and cargo intact; old floor items overlapped by new furniture move to the nearest free floor cell. A previously unexplored map starts empty. Invalid new exploration data is rejected transactionally.

Added acceptance coverage checks progressive discovery, map persistence and old-save migration, furniture collision, connected routes, fixed lighting without creature exposure, and creature exclusion over pursuit/search/patrol. Browser checks cover Map navigation, pause/resume, new-stage rendering with the torch off, safe-room behavior, and reload. This adds two environmental stages and one smaller lit room; further liminal settings and interactions remain content work.
