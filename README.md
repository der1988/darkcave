# LIMINAL — foundation prototype

The project has been reduced to its basic playable foundation: one dark isometric room, two brothers, movement and a handheld flashlight.

## Run

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:browser
```

## Controls

- WASD / arrow keys: move in screen-relative isometric directions
- Mouse: aim the flashlight and set where its beam ends on the floor
- Space: switch the flashlight on or off
- Shift: move faster

## Current behavior

The older brother is controlled directly. The younger brother follows at a short distance and moves slightly faster so he can close small gaps without teleporting. Both characters collide with the room boundary.

The room has no ambient visibility. Floors and walls appear only inside the flashlight cone. The cursor marks the beam's endpoint on the floor, controlling its direction and length. The characters remain as very faint silhouettes when unlit so their position is still controllable.

There are no enemies, dialogue, inventory, cargo, map, furniture, objectives, audio, persistence or menus in this version. Those systems can be reconsidered after movement and flashlight handling feel correct.

The renderer keeps crisp logical pixels, a dense quarter-size floor grid and the fixed 2:1 isometric projection. Unit tests cover movement normalization, collision, projection, following distance and flashlight direction/range. The Chromium acceptance test exercises the real keyboard, mouse and canvas behavior.
