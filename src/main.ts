import './style.css';
import { material, solid, spawn, visible, move, project, screenToWorld } from './world';

const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const player = { ...spawn };
const camera = { ...spawn };
const keys = new Set<string>();
let width = 0, height = 0, angle = -Math.PI / 2, targetAngle = angle;
let bodyAngle = angle;
let lightOn = true, walking = false, stride = 0, time = 0;
let mouse: { x: number; y: number } | null = null;
let offsetX = 0, offsetY = 0;
function resize() {
  // Integer CSS-to-logical scaling preserves the silhouette's tiny, crisp pixels.
  const scale = Math.max(1, Math.ceil(window.innerHeight / 360));
  width = canvas.width = Math.ceil(window.innerWidth / scale);
  height = canvas.height = Math.ceil(window.innerHeight / scale);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize); resize();
const controls = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'KeyF'];
window.addEventListener('keydown', e => {
  if (!controls.includes(e.code)) return;
  e.preventDefault(); keys.add(e.code);
  if (e.code === 'KeyF' && !e.repeat) lightOn = !lightOn;
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => { keys.clear(); last = performance.now(); });
canvas.addEventListener('pointermove', e => { mouse = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerdown', () => canvas.focus());

const RANGE = 9.5;
const palettes = [[0, 0, 0], [109, 100, 72], [93, 98, 84], [119, 108, 87]];
function smooth(a: number, b: number, n: number) {
  const t = Math.max(0, Math.min(1, (n - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
let lampX = player.x, lampY = player.y;
function illumination(x: number, y: number, z: number, nx = 0, ny = 0): number {
  const dx = x - lampX, dy = y - lampY, distance = Math.hypot(dx, dy);
  if (distance > RANGE) return 0;
  const local = 0.13 * (1 - smooth(0.1, 1.25, distance));
  const dot = distance < 0.01 ? 1 : (dx * Math.cos(angle) + dy * Math.sin(angle)) / distance;
  const cone = smooth(Math.cos(0.51), Math.cos(0.25), dot);
  const falloff = (1 - smooth(1.2, RANGE, distance)) / (1 + distance * distance * 0.014);
  const incidence = nx || ny ? 0.35 + 0.65 * Math.max(0, -(dx * nx + dy * ny) / Math.max(0.01, distance)) : 1;
  const vertical = 1 - smooth(0.85, 1.75, Math.abs(z - 0.48));
  const beam = lightOn ? cone * falloff * incidence * vertical : 0;
  if (beam + local < 0.008 || !visible(lampX, lampY, x + nx * 0.012, y + ny * 0.012)) return 0;
  return Math.min(1, beam + local);
}
function polygon(points: number[][], color: number[], intensity: number) {
  ctx.fillStyle = `rgb(${Math.round(color[0] * intensity)},${Math.round(color[1] * intensity)},${Math.round(color[2] * intensity)})`;
  // Scan-convert on the logical pixel grid: adjacent patches share exact edges,
  // avoiding Canvas antialias seams that would look like a decorative tile grid.
  const vertices = points.map(([x,y,z]) => {
    const p = project(x,y,z);
    return { x: Math.round(p.x+offsetX), y: Math.round(p.y+offsetY) };
  });
  const top = Math.max(0,Math.min(...vertices.map(p=>p.y)));
  const bottom = Math.min(height,Math.max(...vertices.map(p=>p.y)));
  for (let row=top; row<bottom; row++) {
    const scan=row+.5, intersections:number[]=[];
    for (let i=0;i<vertices.length;i++) {
      const a=vertices[i],b=vertices[(i+1)%vertices.length];
      if ((a.y<=scan && b.y>scan)||(b.y<=scan && a.y>scan))
        intersections.push(a.x+(scan-a.y)*(b.x-a.x)/(b.y-a.y));
    }
    if (intersections.length<2) continue;
    const left=Math.ceil(Math.min(...intersections)-.5);
    const right=Math.ceil(Math.max(...intersections)-.5);
    ctx.fillRect(left,row,right-left,1);
  }
}
function noise(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function floor(x: number, y: number, m: number) {
  const color = palettes[m];
  // Small surface samples receive real light; no cone or visibility-mask overlay.
  const step = 0.25;
  for (let v = 0; v < 1; v += step) for (let u = 0; u < 1; u += step) {
    const a = x + u, b = y + v;
    const intensity = illumination(a + step / 2, b + step / 2, 0);
    if (intensity < 0.008) continue;
    const variation = 0.96 + noise(a, b) * 0.08;
    polygon([[a,b,0],[a+step,b,0],[a+step,b+step,0],[a,b+step,0]], color, intensity * variation);
  }
}
const WALL_HEIGHT = 1.28;
function wall(x: number, y: number) {
  // The two camera-facing faces. Hidden faces never become visible through a block.
  for (const axis of [0, 1]) {
    const nx = axis === 0 ? 1 : 0, ny = axis === 1 ? 1 : 0;
    if (solid(x + nx, y + ny)) continue;
    for (let u = 0; u < 1; u += 0.25) for (let z = 0; z < WALL_HEIGHT; z += 0.16) {
      const a = axis === 0 ? x + 1 : x + u;
      const b = axis === 0 ? y + u : y + 1;
      const ex = axis === 0 ? a : a + 0.25, ey = axis === 0 ? b + 0.25 : b;
      const intensity = illumination((a+ex)/2, (b+ey)/2, z+0.08, nx, ny);
      const color = z < 0.16 ? [97, 91, 72] : axis === 0 ? [178, 166, 126] : [157, 151, 119];
      polygon([[a,b,z],[ex,ey,z],[ex,ey,z+0.16],[a,b,z+0.16]], color, intensity);
    }
  }
  polygon([[x,y,WALL_HEIGHT],[x+1,y,WALL_HEIGHT],[x+1,y+1,WALL_HEIGHT],[x,y+1,WALL_HEIGHT]], [0,0,0], 0);
  // A narrow lit cap describes thickness; do not illuminate the interior of solid cells.
  for (let u = 0; u < 1; u += 0.25) {
    if (!solid(x+1, y)) polygon([[x+.87,y+u,WALL_HEIGHT],[x+1,y+u,WALL_HEIGHT],[x+1,y+u+.25,WALL_HEIGHT],[x+.87,y+u+.25,WALL_HEIGHT]], [159,150,120], illumination(x+1,y+u+.125,WALL_HEIGHT,1,0)*.7);
    if (!solid(x,y+1)) polygon([[x+u,y+.87,WALL_HEIGHT],[x+u+.25,y+.87,WALL_HEIGHT],[x+u+.25,y+1,WALL_HEIGHT],[x+u,y+1,WALL_HEIGHT]], [159,150,120], illumination(x+u+.125,y+1,WALL_HEIGHT,0,1)*.7);
  }
}
function character() {
  const p = project(player.x, player.y);
  const x = Math.round(p.x + offsetX), y = Math.round(p.y + offsetY);
  const step = walking ? Math.sin(stride) : 0;
  const bob = walking ? Math.round(Math.abs(step)) : Math.round(Math.sin(time * 1.8) * .25);
  const face = project(Math.cos(angle), Math.sin(angle));
  const side = face.x >= 0 ? 1 : -1;
  const facing = project(Math.cos(bodyAngle), Math.sin(bodyAngle));
  const back = facing.y < 0;
  const profile = Math.abs(facing.x) > Math.abs(facing.y) * 2.5;
  const legSwing = Math.round(step * (profile ? 2 : 1));
  const rect = (dx: number, dy: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x + dx, y + dy - bob, w, h); };
  // Seventeen pixels, six tones, no face. A coat and two distinct, alternating legs.
  ctx.fillStyle = '#090908'; ctx.fillRect(x-3,y-1,7,2);
  rect(-2 + legSwing, -7, 2, 6 + Math.round(step * 1.5), '#4b4b42');
  rect(1 - legSwing, -7, 2, 6 - Math.round(step * 1.5), '#777568');
  rect(-2, -13, profile ? 4 : 5, 7, back ? '#62675b' : '#777667');
  rect(-2, -13, 1, 6, '#44483f');
  rect(2, -12, 1, 6, '#98917a');
  rect(-1, -17, 3, 4, '#a59c80');
  rect(-1, -17, 3, back ? 3 : 1, '#4e5148');
  rect(side > 0 ? 3 : -4, -11, 2, 4, '#68695c');
  rect(side > 0 ? 4 : -5, -9, 2, 2, '#b5aa88');
  rect(side > 0 ? 5 : -6, -10, 2, 2, lightOn ? '#eee0ae' : '#5f6055');
}
function update(dt: number) {
  const sx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  const sy = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
  const direction = screenToWorld(sx, sy);
  const length = Math.hypot(direction.x, direction.y);
  const beforeX = player.x, beforeY = player.y;
  if (length > 0) {
    bodyAngle = Math.round(Math.atan2(direction.y,direction.x) / (Math.PI/4)) * Math.PI/4;
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 2.6 : 1.65;
    move(player, direction.x / length * speed * dt, direction.y / length * speed * dt);
    if (!mouse) targetAngle = Math.atan2(direction.y, direction.x);
  }
  walking = Math.hypot(player.x-beforeX,player.y-beforeY) > 0.0001;
  stride += Math.hypot(player.x-beforeX,player.y-beforeY) * 9;
  const follow = 1 - Math.exp(-dt * 5);
  camera.x += (player.x-camera.x)*follow; camera.y += (player.y-camera.y)*follow;
  const c = project(camera.x,camera.y);
  offsetX = width/2-c.x; offsetY = height/2-c.y+9;
  if (mouse) {
    const p = project(player.x,player.y,0.4);
    const aim = screenToWorld(mouse.x / innerWidth * width - p.x - offsetX, mouse.y / innerHeight * height - p.y - offsetY);
    if (Math.hypot(aim.x,aim.y) > .1) targetAngle = Math.atan2(aim.y,aim.x);
  }
  angle += Math.atan2(Math.sin(targetAngle-angle),Math.cos(targetAngle-angle)) * (1-Math.exp(-dt*16));
  if (!walking) bodyAngle = Math.round(angle / (Math.PI/4)) * Math.PI/4;
  // Hand offset in the same projected location as the tiny flashlight sprite.
  const side = project(Math.cos(angle),Math.sin(angle)).x >= 0 ? 1 : -1;
  const hand = screenToWorld(side * 5, 0);
  lampX = player.x + hand.x; lampY = player.y + hand.y;
  if (solid(lampX,lampY)) { lampX = player.x; lampY = player.y; }
}
function render() {
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height);
  const drawables: { x: number; y: number; depth: number; player?: boolean }[] = [];
  for (let y = Math.floor(player.y-RANGE-1); y <= player.y+RANGE+1; y++) {
    for (let x = Math.floor(player.x-RANGE-1); x <= player.x+RANGE+1; x++) {
      if (Math.hypot(x+.5-player.x,y+.5-player.y)>RANGE+1.5) continue;
      const m = material(x,y);
      if (m) floor(x,y,m);
      else if (!solid(x+1,y) || !solid(x,y+1)) drawables.push({x,y,depth:x+y+1});
    }
  }
  drawables.push({x:player.x,y:player.y,depth:player.x+player.y,player:true});
  drawables.sort((a,b)=>a.depth-b.depth);
  for (const d of drawables) { if (d.player) character(); else wall(d.x,d.y); }
}
let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now-last)/1000,.05); last = now; time += dt;
  update(dt); render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
