# LIMINAL — The Layers of Memory

Two brothers explore empty architecture, recover memories, and bring useful objects home. The existing Canvas pixel renderer, isometric camera, flashlight, cargo, heartbeat and stealth systems remain the foundation.

## Run

Node.js 22.12+ and npm (validated on Node 24):

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:browser
```

`npm run preview` serves `dist`. Browser tests start servers on ports 5174 and 5176 and use `CHROMIUM_PATH`, `/usr/bin/chromium`, or installed Playwright Chromium. No backend, secrets, runtime network requests or downloaded game assets are required.

## Controls

The **H** screen is generated from the input configuration.

- WASD / arrows: move relative to the screen
- Mouse: aim and face a direction
- Space: toggle requested flashlight state
- E: interact, pick up or use
- I / Tab: inventory, storage and explored map
- C: character and equipment
- Shift: run when the load permits
- Ctrl: silent movement; overrides Shift
- H: toggle Help
- Escape: close the current menu

Menus suspend movement, hostile AI, health changes and audio consistently. Map controls support zoom, dragging, directional buttons and recentering. Keyboard/pointer interaction enables browser audio.

## Playable first layer

The brothers start at their protected home. Connected yellow rooms, service areas, underground parking and hotel corridors surround a dark passage network. The empty mall, abandoned playground and waiting annex remain accessible. Domestic rooms contain authored furniture, figures and restrained Italian dialogue. Nine authored architectural anomalies include intersecting, sunken and floating furnishings.

Discover the kitchen in the north and the living room in the west. Recover the cup and photograph, bring them home and deliver both to the archive. The home computer records progress and unlocks **Layer 02 — Unknown**. This destination is deliberately not yet playable; the first layer remains explorable after delivery.

The younger brother follows traversable routes, runs more slowly, matches silent movement and seeks nearby shared cover when exposed to a perceived threat. The nineteen-pixel older brother and twelve-pixel child have distinct proportions and restrained directional animations.

The original Pursuer patrols the connected dark network and reacts to flashlight exposure. Blind Clickers track audible events; Zombies combine directional sight and hearing. Protected home, memory rooms, mall, playground and annex exclude hostiles. Dim lamps elsewhere do not imply safety. Enemies do not appear on the map, and ambient darkness never reveals the Pursuer outside the beam.

Both brothers have health. Home restores health gradually. Capture or incapacitation returns both home without deleting collected objects or completed mechanisms. Enemy pursuit is not persisted; loading gives a short grace period. Original synthesized ambience, spatial footsteps, creature voices and heartbeat are retained, with restrained chase audio following confirmed pursuit.

## Cargo, equipment and home

Items have one authoritative stable-ID location: floor, inventory, equipment, storage or an installed/consumed target. Weight, bulk, hand occupancy and storage capacities are checked before transfers. Large cargo is visibly carried and slows movement. Two-handed cargo prevents handheld flashlight use; the utility clip lamp restores lighting. Space retains the requested light state.

The original transport example remains playable: collect the service key, unlock S-04, carry its electrical module through the service rooms into the underground and install it in the inactive machine to open the shutter. Tools, batteries, backpack, harness and storage retain their functional interactions.

Recover cabinets, shelves, a desk, crate, generator and lamp. Carry them home and use **Sistema in casa** to choose a grid position and rotation. Placement checks collisions, actor overlap and access to the entrance, computer and archive. Installed containers provide finite storage. Most furniture must be emptied before moving; the portable crate can carry its contents, whose weight contributes to the load. Switch on an installed generator to power the home lamp. Baseline home safety does not depend on power.

## Vision, map and persistence

Directional 120-degree vision is separate from flashlight illumination. Geometry blocks sight; nearby architecture remains faintly readable in darkness. The map records observed floor, wall and obstruction cells per layer, with undiscovered space black. Remembered architecture does not reveal moving actors or undiscovered items.

Save format **4** retains the `liminal.transport.v1` localStorage key. It stores both brothers, health, facing, items, equipment, furniture rotation, mechanisms, explored maps, dialogue events and generator state. Valid older saves migrate with stable item ownership; objects left in the former safe-room footprint move to nearby valid floor. Validation rejects inconsistent ownership, invalid positions, capacities or mechanism consumption; incompatible data starts a clean session. Storage failures leave the current session playable.

The computer's confirmed new-game action backs up the previous save. A confirmed restore action validates and restores that backup, retaining another copy of the current session. Saves are local to this browser, not cloud accounts.

## Architecture

- `levels.ts`, `world.ts`, `zones.ts`, `environments.ts`: authored connected architecture, layer metadata, protected regions and dark network.
- `vision.ts`, `light.ts`, `exploration.ts`: field of view, occlusion, illumination and persistent map memory.
- `movement.ts`, `companion.ts`, `player-sprite.ts`: normalized movement, follower navigation and shared pixel character rendering.
- `creature.ts`, `enemies.ts`, `sound-events.ts`: Pursuer, hearing/vision inhabitants and bounded sound observations.
- `items.ts`, `possessions.ts`, `base.ts`: item data, authoritative ownership, save validation and furniture footprints/placement.
- `controls.ts`, `menu.ts`: centralized keys, inventory, equipment, Help, map, computer and placement panels.
- `dialogue.ts`, `pixel-text.ts`, `scenery.ts`: contextual dialogue, original bitmap lettering and authored furnishings/anomalies.
- `audio.ts`, `heart.ts`, `hud.ts`, `main.ts`: sound, perceived danger, health and scene integration.

## Validation and remaining scope

Unit coverage includes item conservation, cargo constraints, complete transport routes, save migration/rejection, storage, portable crate weight, home placement, memory delivery, companion movement/cover, directional discovery, enemy perception and dark-network connectivity.

Chromium acceptance suites exercise real controls, pause/resume, silent movement, audio, inventory, equipment, map controls, module installation, memory dialogue/delivery, computer unlock, furniture placement/storage, power, damage/capture, reload, new-game backup/restore and narrow viewports. Browser scenarios use development-only staging hooks; collision-checked route tests separately traverse the level. These hooks are absent from production.

Foundation, cargo, world expansion and persistence phases are implemented for this first-layer vertical slice. Layer 02 and the wider campaign remain future content. Furniture uses validated grid placement, not free physics; items use individual instances rather than stack merging. Collision, sight and sound use conservative 2.5D approximations. Broader manual playtesting should refine navigation, difficulty and art. Touch movement and drag-and-drop inventory are not implemented; click actions are supported.

## Vercel

`vercel.json` builds with `npm run build` and serves `dist` from the repository root. A successful local production build does not establish the status of a Vercel deployment.
