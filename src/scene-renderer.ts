import * as THREE from "three";
import type { Game } from "./game";
import { Flashlight, TORCH } from "./lighting";
import { COMPUTER } from "./room";
import { buildWorld, box } from "./world-3d";
import { createPerson, updatePerson } from "./actors-3d";
import type { Throwable } from "./throwables";

/** Perspective camera, GPU lights and input projection; simulation stays in world space. */
export class SceneRenderer {
  readonly torch = new Flashlight();
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(58, 1, 0.05, 70);
  width = 0;
  height = 0;
  private world: ReturnType<typeof buildWorld>;
  private player: ReturnType<typeof createPerson>;
  private brother: ReturnType<typeof createPerson>;
  private creatures: ReturnType<typeof createPerson>[];
  private objects = new Map<string, THREE.Mesh>();
  private raycaster = new THREE.Raycaster();
  private spot = new THREE.SpotLight(
    0xffedca,
    120,
    TORCH.range,
    TORCH.angle,
    0.7,
    2,
  );
  private lightTarget = new THREE.Object3D();
  private yaw = -Math.PI / 4;
  private elevation = 0.42;
  private previous = 0;
  private pointer = { x: 0, y: 0 };
  private orbit = false;
  private dialogue = document.createElement("div");
  private hint = document.createElement("div");
  constructor(
    readonly canvas: HTMLCanvasElement,
    private game: Game,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene.background = new THREE.Color("#050807");
    this.scene.fog = new THREE.FogExp2("#050807", 0.085);
    this.scene.add(new THREE.AmbientLight(0xbac5bb, 2.0));
    this.world = buildWorld(this.scene);
    this.player = createPerson(this.scene);
    this.brother = createPerson(this.scene, true);
    this.creatures = game
      .clickers()
      .map(() => createPerson(this.scene, false, true));
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.bias = -0.0003;
    this.spot.target = this.lightTarget;
    this.scene.add(this.spot, this.lightTarget);
    this.dialogue.className = "speech-bubble";
    this.hint.className = "interaction-hint";
    document.body.append(this.dialogue, this.hint);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button === 2) {
        this.orbit = true;
        this.pointer = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      }
    });
    canvas.addEventListener("pointerup", (event) => {
      if (event.button === 2) this.orbit = false;
    });
    canvas.addEventListener("pointercancel", () => (this.orbit = false));
    addEventListener("blur", () => (this.orbit = false));
    this.resize();
    this.updateCamera(1);
  }
  resize() {
    this.width = Math.max(320, Math.ceil(innerWidth * 0.65));
    this.height = Math.max(180, Math.ceil(innerHeight * 0.65));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }
  movement(horizontal: number, vertical: number) {
    const forward = -vertical,
      dx = Math.cos(this.yaw) * forward - Math.sin(this.yaw) * horizontal,
      dy = Math.sin(this.yaw) * forward + Math.cos(this.yaw) * horizontal;
    return { horizontal: (dx - dy) / 2, vertical: (dx + dy) / 2 };
  }
  private updateCamera(response: number) {
    const p = this.game.player(),
      focus = new THREE.Vector3(p.x, 0.45, p.y),
      distance = 2.7;
    const desired = new THREE.Vector3(
      p.x - Math.cos(this.yaw) * distance,
      0.45 + distance * Math.sin(this.elevation),
      p.y - Math.sin(this.yaw) * distance,
    );
    this.camera.position.lerp(desired, response);
    this.camera.lookAt(focus);
    this.camera.updateMatrixWorld();
    // Fade only surfaces between the camera and the characters, never affect collisions.
    for (const wall of this.world.walls) {
      wall.material.opacity = 1;
      wall.material.depthWrite = true;
    }
    for (const actor of [this.game.player(), this.game.brother()]) {
      const target = new THREE.Vector3(actor.x, 0.35, actor.y),
        direction = target.clone().sub(this.camera.position),
        length = direction.length();
      this.raycaster.set(this.camera.position, direction.normalize());
      this.raycaster.far = length;
      for (const hit of this.raycaster.intersectObjects(this.world.walls)) {
        const mesh = hit.object as THREE.Mesh<
          THREE.BoxGeometry,
          THREE.MeshStandardMaterial
        >;
        mesh.material.opacity = 0.22;
        mesh.material.depthWrite = false;
      }
    }
    this.raycaster.far = Infinity;
  }
  private pointerRay(x: number, y: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        (-(y - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
  }
  aim(x: number, y: number) {
    if (this.orbit) {
      this.yaw += (x - this.pointer.x) * 0.007;
      this.elevation = THREE.MathUtils.clamp(
        this.elevation - (y - this.pointer.y) * 0.004,
        0.15,
        0.75,
      );
      this.pointer = { x, y };
    }
    this.pointerRay(x, y);
    const hit = new THREE.Vector3();
    if (
      this.raycaster.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
        hit,
      )
    ) {
      const p = this.game.player();
      this.torch.angle = Math.atan2(hit.z - p.y, hit.x - p.x);
    } else this.torch.angle = this.yaw;
  }
  screenPoint(x: number, y: number, z = 0) {
    const p = new THREE.Vector3(x, z, y).project(this.camera),
      rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + ((p.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - p.y) * rect.height) / 2,
    };
  }
  pickUpAt(x: number, y: number) {
    this.pointerRay(x, y);
    const pickable = [...this.objects.values()].filter(
      (obj) => obj.visible && obj.userData.state === "ground",
    );
    const hits = this.raycaster.intersectObjects([
      ...pickable,
      ...this.world.walls.filter((w) => w.visible),
      ...this.world.fixtures,
    ]);
    const first = hits[0]?.object;
    if (first?.userData.itemId) return this.game.pickUp(first.userData.itemId);
    // Small pixel-sized stones also accept a close projected click, with world occlusion checked by pickup.
    for (const item of this.game
      .objects()
      .filter((i) => i.state === "ground")) {
      const p = this.screenPoint(item.x, item.y, 0.03);
      if (Math.hypot(p.x - x, p.y - y) < 12) return this.game.pickUp(item.id);
    }
    return false;
  }
  clickComputer(x: number, y: number) {
    if (
      Math.hypot(
        this.game.player().x - COMPUTER.x,
        this.game.player().y - COMPUTER.y,
      ) > 1.25
    )
      return false;
    const p = this.screenPoint(COMPUTER.x, COMPUTER.y, 0.53);
    if (Math.hypot(p.x - x, p.y - y) > 25) return false;
    return this.game.interact();
  }
  private updateObjects(items: Throwable[]) {
    for (const item of items) {
      let mesh = this.objects.get(item.id);
      if (!mesh) {
        mesh = box(
          this.scene,
          item.x,
          0,
          item.y,
          item.kind === "stone" ? 0.08 : 0.065,
          item.kind === "stone" ? 0.06 : 0.065,
          item.kind === "stone" ? 0.035 : 0.17,
          item.kind === "stone" ? "#a6a295" : "#577f68",
        );
        mesh.userData.itemId = item.id;
        this.objects.set(item.id, mesh);
      }
      mesh.visible = item.state !== "held";
      mesh.userData.state = item.state;
      mesh.position.set(
        item.x,
        item.z + (item.kind === "stone" ? 0.017 : 0.085),
        item.y,
      );
      mesh.scale.set(1, item.state === "broken" ? 0.04 : 1, 1);
    }
  }
  render(now: number) {
    const dt = this.previous
      ? Math.min(0.05, (now - this.previous) / 1000)
      : 0.016;
    this.previous = now;
    const p = this.game.player(),
      b = this.game.brother(),
      progress = this.game.progress();
    this.torch.unlocked = progress.doorOpen;
    this.world.gate.visible = !progress.doorOpen;
    this.world.memory.visible = !progress.memoryCollected;
    this.world.monitor.material.emissive.set(
      progress.doorOpen ? "#397b55" : "#294f44",
    );
    updatePerson(this.player, p, now);
    updatePerson(this.brother, b, now, true);
    this.game.clickers().forEach((actor, index) => {
      const mesh = this.creatures[index];
      updatePerson(mesh, actor, now);
      mesh.root.visible = this.torch.at({ ...actor, z: 0.3 }, p) > 0.05;
    });
    this.updateObjects(this.game.objects());
    const held = this.game.heldObject();
    this.player.held.visible = !!held;
    if (held) {
      this.player.held.scale.y = held.kind === "bottle" ? 2 : 1;
      this.player.held.material.color.set(
        held.kind === "bottle" ? "#577f68" : "#a6a295",
      );
      this.player.leftArm.rotation.x = -0.7;
    }
    this.updateCamera(1 - Math.exp(-10 * dt));
    const origin = this.torch.origin(p);
    this.spot.position.set(origin.x, origin.z, origin.y);
    this.lightTarget.position.set(
      origin.x + Math.cos(this.torch.angle) * 6,
      origin.z - 0.84,
      origin.y + Math.sin(this.torch.angle) * 6,
    );
    this.spot.visible = this.torch.on;
    this.renderer.render(this.scene, this.camera);
    const line = this.game.dialogue();
    this.dialogue.hidden = !line;
    if (line) {
      const actor = line.speaker === "player" ? p : b,
        screen = this.screenPoint(actor.x, actor.y, 0.85);
      this.dialogue.textContent = line.text;
      this.dialogue.style.left = `${screen.x}px`;
      this.dialogue.style.top = `${screen.y}px`;
    }
    const power = this.game.chargePower();
    this.hint.textContent = progress.finished
      ? "Uscita raggiunta"
      : power !== null
        ? `Potenza lancio ${Math.round(power * 100)}%`
        : (this.game.interactionHint() ?? "");
  }
}
