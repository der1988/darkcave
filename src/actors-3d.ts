import * as THREE from "three";
import { box } from "./world-3d";
import type { ActorState } from "./game";
export function createPerson(
  scene: THREE.Scene,
  child = false,
  creature = false,
) {
  const root = new THREE.Group();
  const coat = creature ? "#514739" : child ? "#627755" : "#466b73",
    skin = creature ? "#8b7c61" : "#bc8a68";
  box(root, 0, 0.24, 0, 0.19, 0.13, 0.28, coat);
  box(root, 0, 0.53, 0, 0.14, 0.14, 0.15, skin);
  if (!creature) box(root, 0, 0.65, 0, 0.15, 0.15, 0.045, "#443126");
  else
    for (const [x, z] of [
      [-0.08, 0],
      [0.06, 0.04],
      [0.04, -0.07],
    ])
      box(root, x, 0.57, z, 0.1, 0.12, 0.11, "#a38c68");
  const leftLeg = box(root, -0.055, 0, 0, 0.07, 0.08, 0.25, "#303735"),
    rightLeg = box(root, 0.055, 0, 0, 0.07, 0.08, 0.25, "#3d4140");
  const leftArm = box(root, -0.135, 0.27, 0, 0.055, 0.07, 0.25, coat),
    rightArm = box(root, 0.135, 0.27, 0, 0.055, 0.07, 0.25, coat);
  if (!creature) {
    box(root, -0.135, 0.255, 0, 0.055, 0.075, 0.045, skin);
    box(root, 0.135, 0.255, 0, 0.055, 0.075, 0.045, skin);
    box(root, -0.055, 0, -0.015, 0.08, 0.12, 0.04, "#292924");
    box(root, 0.055, 0, -0.015, 0.08, 0.12, 0.04, "#292924");
    box(root, 0, 0.53, -0.075, 0.03, 0.025, 0.06, skin);
    box(
      root,
      -0.07,
      0.28,
      0.075,
      0.025,
      0.025,
      0.24,
      child ? "#945840" : "#8b5544",
    );
    box(
      root,
      0.07,
      0.28,
      0.075,
      0.025,
      0.025,
      0.24,
      child ? "#945840" : "#8b5544",
    );
  }
  const held = box(root, -0.15, 0.31, -0.12, 0.065, 0.06, 0.065, "#999386");
  held.visible = false;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = creature;
  });
  if (child) root.scale.setScalar(0.76);
  scene.add(root);
  return { root, leftLeg, rightLeg, leftArm, rightArm, held };
}
export type PersonMesh = ReturnType<typeof createPerson>;
export function updatePerson(
  mesh: PersonMesh,
  actor: ActorState,
  time: number,
  child = false,
) {
  mesh.root.position.set(actor.x, 0, actor.y);
  mesh.root.rotation.y = -actor.heading - Math.PI / 2;
  const phase = Math.round(actor.stride * 4) / 4,
    step = actor.moving ? Math.sin(phase) : 0;
  mesh.root.position.y = actor.moving
    ? Math.abs(step) * 0.012
    : Math.sin(time * 0.0018) * 0.004;
  const scale = child ? 0.76 : 1;
  mesh.root.scale.set(scale, scale * (actor.stealth ? 0.83 : 1), scale);
  mesh.leftLeg.rotation.x = step * 0.3;
  mesh.rightLeg.rotation.x = -step * 0.3;
  mesh.leftArm.rotation.x = -step * 0.2;
  mesh.rightArm.rotation.x = step * 0.2;
  mesh.root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.material.transparent = true;
      obj.material.opacity = 1;
    }
  });
}
