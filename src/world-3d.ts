import * as THREE from "three";
import {
  ROOMS,
  WALLS,
  MEMORY_GATE,
  ROOM,
  FIXTURES,
  MARKINGS,
  STOREFRONTS,
  COMPUTER,
  MEMORY,
  EXIT,
} from "./room";
export function material(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.02,
  });
}
export function box(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  color: string,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function buildWorld(scene: THREE.Scene) {
  const walls: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[] = [];
  for (const room of ROOMS) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(room.maxX - room.minX, room.maxY - room.minY),
      material(room.floor),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(
      (room.minX + room.maxX) / 2,
      0,
      (room.minY + room.maxY) / 2,
    );
    floor.receiveShadow = true;
    scene.add(floor);
  }
  for (const mark of MARKINGS)
    box(
      scene,
      mark.x + mark.width / 2,
      0.002,
      mark.y + mark.depth / 2,
      mark.width,
      mark.depth,
      0.003,
      mark.color,
    );
  const addWall = (wall: typeof MEMORY_GATE) => {
    const mesh = box(
      scene,
      wall.axis === "x" ? wall.position : (wall.from + wall.to) / 2,
      0,
      wall.axis === "x" ? (wall.from + wall.to) / 2 : wall.position,
      wall.axis === "x" ? 0.06 : wall.to - wall.from,
      wall.axis === "x" ? wall.to - wall.from : 0.06,
      ROOM.wallHeight,
      "#30382f",
    );
    mesh.material.transparent = true;
    walls.push(mesh);
    return mesh;
  };
  WALLS.forEach(addWall);
  const gate = addWall(MEMORY_GATE);
  gate.material.color.set("#5b4940");
  // All outer boundaries have actual volume, including the formerly cutaway faces.
  for (const room of ROOMS)
    for (const axis of ["x", "y"] as const) {
      if (axis === "x" && room.maxX === ROOM.width)
        addWall({ axis, position: room.maxX, from: room.minY, to: room.maxY });
      if (axis === "y" && room.maxY === ROOM.height)
        addWall({ axis, position: room.maxY, from: room.minX, to: room.maxX });
    }
  for (const shop of STOREFRONTS) {
    const x = (shop.from + shop.to) / 2,
      w = shop.to - shop.from;
    box(scene, x, 0.05, 0.045, w, 0.035, 0.95, "#343a35");
    for (let y = 0.1; y < 1; y += 0.08)
      box(scene, x, y, 0.069, w, 0.012, 0.012, "#242b26");
    box(scene, x, 1.1, 0.045, w, 0.055, 0.16, shop.sign);
  }
  const fixtures: THREE.Mesh[] = [];
  for (const prop of FIXTURES) {
    const mesh = box(
      scene,
      prop.x + prop.width / 2,
      0,
      prop.y + prop.depth / 2,
      prop.width,
      prop.depth,
      prop.height,
      prop.color,
    );
    fixtures.push(mesh);
    if (prop.kind === "planter")
      box(
        scene,
        prop.x + prop.width / 2,
        prop.height - 0.02,
        prop.y + prop.depth / 2,
        prop.width * 0.85,
        prop.depth * 0.85,
        0.08,
        "#253c2c",
      );
  }
  const monitor = box(
    scene,
    COMPUTER.x,
    0.44,
    COMPUTER.y,
    0.25,
    0.045,
    0.18,
    "#405e5d",
  );
  monitor.material.emissive.set("#294f44");
  monitor.material.emissiveIntensity = 0.4;
  monitor.userData.computer = true;
  fixtures.push(monitor);
  const memory = box(
    scene,
    MEMORY.x,
    0.015,
    MEMORY.y,
    0.13,
    0.09,
    0.05,
    "#a07d66",
  );
  const exit = box(scene, EXIT.x, 0.7, 0.04, 0.65, 0.035, 0.19, "#3b5345");
  exit.material.emissive.set("#27392d");
  exit.material.emissiveIntensity = 0.25;
  return { walls, gate, fixtures, monitor, memory };
}
