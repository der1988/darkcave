import {
  ITEMS,
  SLOTS,
  TARGETS,
  seedItems,
  type Item,
  type Slot,
  type Target,
  type Location,
} from "./items";
import { RADIUS, material, canStand, setObstacles, spawn, visible } from "./world";
import { beam, type Point, type Lamp } from "./light";
export const SAVE_KEY = "liminal.transport.v1";
export const SAVE_VERSION = 1;
export type Save = {
  version: number;
  map: string;
  player: Point;
  items: Item[];
  active: string[];
  lightRequested: boolean;
};
export const owned = (i: Item) =>
  i.location.kind === "inventory" || i.location.kind === "equipped";
export class Possessions {
  items = seedItems();
  active = new Set<string>();
  saveWarning = "";
  get weight() {
    return this.items
      .filter(owned)
      .reduce((n, i) => n + ITEMS[i.def].weight, 0);
  }
  get equipment() {
    return this.items.filter((i) => i.location.kind === "equipped");
  }
  get capacity() {
    return (
      12 + this.equipment.reduce((n, i) => n + (ITEMS[i.def].capacity || 0), 0)
    );
  }
  get bulk() {
    return this.items
      .filter((i) => i.location.kind === "inventory")
      .reduce((n, i) => n + ITEMS[i.def].bulk, 0);
  }
  get bulkCapacity() {
    return (
      6 +
      this.equipment.reduce((n, i) => n + (ITEMS[i.def].bulkCapacity || 0), 0)
    );
  }
  get bodyLight() {
    return this.equipment.some((i) => ITEMS[i.def].capability === "body-light");
  }
  get hands() {
    return this.equipment.reduce(
      (n, i) =>
        n +
        (i.location.kind === "equipped" && i.location.slot.includes("hand")
          ? ITEMS[i.def].hands || 1
          : 0),
      0,
    );
  }
  get canLight() {
    return this.hands < 2 || this.bodyLight;
  }
  get cargo() {
    return this.equipment.find((i) => ITEMS[i.def].large);
  }
  get speed() {
    return Math.min(
      this.cargo?.def === "module" ? 0.8 : 1,
      1 - Math.max(0, this.weight / this.capacity - 0.2) * 0.42,
    );
  }
  get canRush() {
    return this.hands < 2 && this.weight / this.capacity < 0.65;
  }
  sync() {
    const points: Point[] = [];
    for (const t of TARGETS)
      if (t.kind !== "door" || !this.active.has(t.id))
        points.push(...(t.cells || [t.position]));
    for (const i of this.items)
      if (i.location.kind === "world" && ITEMS[i.def].large)
        points.push(i.location.position);
    setObstacles(points);
  }
  private check(): string | null {
    if (this.weight > this.capacity + 0.001)
      return "Too heavy. Equip a backpack or leave something behind.";
    if (this.bulk > this.bulkCapacity)
      return "No room in the bag. Large cargo must be carried visibly.";
    const slots = new Set<Slot>();
    for (const i of this.equipment) {
      if (i.location.kind !== "equipped") continue;
      const d = ITEMS[i.def],
        s = i.location.slot;
      if (!d.slots?.includes(s) || slots.has(s))
        return "That equipment slot is occupied or incompatible.";
      slots.add(s);
      if (
        s === "Cargo attachment" &&
        !this.equipment.some((j) => ITEMS[j.def].capability === "harness")
      )
        return "Equip a cargo harness on the torso first.";
      if (d.hands === 2) {
        if (slots.has("Right hand")) return "Both hands must be free.";
        slots.add("Right hand");
      }
    }
    if (this.hands > 2) return "Both hands must be free.";
    if (
      this.items.some(
        (i) => i.location.kind === "inventory" && ITEMS[i.def].large,
      )
    )
      return "This cargo will not fit in a bag.";
    return null;
  }
  private transfer(item: Item, location: Location): string {
    const before = item.location;
    item.location = location;
    const error = this.check();
    if (error) {
      item.location = before;
      return error;
    }
    this.sync();
    return "";
  }
  item(id: string) {
    return this.items.find((i) => i.id === id);
  }
  take(id: string, player: Point, storage?: string): string {
    const i = this.item(id);
    if (!i) return "Missing item.";
    if (i.location.kind === "world") {
      if (!this.reachable(i.location.position, player, !!ITEMS[i.def].large))
        return "Move closer.";
    } else if (i.location.kind === "storage") {
      if (
        i.location.target !== storage ||
        !this.storageAvailable(storage!, player)
      )
        return "The container is out of reach.";
    } else return "That item is already carried.";
    if (ITEMS[i.def].large)
      return this.transfer(i, { kind: "equipped", slot: "Left hand" });
    return this.transfer(i, { kind: "inventory" });
  }
  equip(id: string, slot: Slot): string {
    const i = this.item(id);
    if (!i || !owned(i)) return "Pick up the item first.";
    return this.transfer(i, { kind: "equipped", slot });
  }
  unequip(id: string): string {
    const i = this.item(id);
    if (!i || i.location.kind !== "equipped") return "Not equipped.";
    return this.transfer(i, { kind: "inventory" });
  }
  drop(id: string, player: Point, occupied: Point[] = []): string {
    const i = this.item(id);
    if (!i || !owned(i)) return "Not carried.";
    const options: Point[] = [];
    for (let y = -1; y <= 1; y++)
      for (let x = -1; x <= 1; x++) {
        const p = {
          x: Math.floor(player.x) + x + 0.5,
          y: Math.floor(player.y) + y + 0.5,
        };
        if (
          Math.hypot(p.x - player.x, p.y - player.y) < 0.65 ||
          (Math.floor(p.x) === Math.floor(player.x) &&
            Math.floor(p.y) === Math.floor(player.y))
        )
          continue;
        if (
          canStand(p.x, p.y) &&
          visible(player.x, player.y, p.x, p.y) &&
          !(ITEMS[i.def].large && [player,...occupied].some(a=>{
            const dx=a.x-Math.max(p.x-.5,Math.min(a.x,p.x+.5));
            const dy=a.y-Math.max(p.y-.5,Math.min(a.y,p.y+.5));
            return Math.hypot(dx,dy)<RADIUS+.01;
          })) &&
          !occupied.some(
            (a) =>
              Math.floor(a.x) === Math.floor(p.x) &&
              Math.floor(a.y) === Math.floor(p.y),
          ) &&
          !this.items.some(
            (j) =>
              j.location.kind === "world" &&
              Math.hypot(
                j.location.position.x - p.x,
                j.location.position.y - p.y,
              ) < 0.5,
          )
        )
          options.push(p);
      }
    options.sort(
      (a, b) =>
        Math.hypot(a.x - player.x, a.y - player.y) -
        Math.hypot(b.x - player.x, b.y - player.y),
    );
    if (!options[0])
      return "No clear floor beside you. Move into a wider space.";
    return this.transfer(i, { kind: "world", position: options[0] });
  }
  store(id: string, target: string, player: Point): string {
    const i = this.item(id);
    if (!i || !owned(i)) return "Not carried.";
    if (!this.storageAvailable(target, player))
      return "Open a nearby cabinet first.";
    return this.transfer(i, { kind: "storage", target });
  }
  storageAvailable(id: string, player: Point) {
    const t = TARGETS.find((t) => t.id === id);
    return (
      !!t?.storage &&
      (!t.rule || this.active.has(id)) &&
      this.reachable(t.position, player, true)
    );
  }
  use(id: string, target: string, player: Point): string {
    const i = this.item(id),
      t = TARGETS.find((t) => t.id === target);
    if (!i || !owned(i)) return "Not carried.";
    if (target === "drink" && ITEMS[i.def].capability === "drink") {
      return this.transfer(i, { kind: "used", target: "drink" });
    }
    if (!t || !this.reachable(t.position, player, true))
      return "No compatible target within reach.";
    if (this.active.has(t.id)) return "Already working.";
    if (!t.rule || ITEMS[i.def].capability !== t.rule.capability)
      return "This item does not fit.";
    if (t.rule.equipped && i.location.kind !== "equipped")
      return "Equip the tool in a hand first.";
    if (t.rule.consume) {
      const error = this.transfer(i, { kind: "used", target: t.id });
      if (error) return error;
    }
    this.active.add(t.id);
    if (t.opens) this.active.add(t.opens);
    this.sync();
    return "";
  }
  /** Point just outside an opaque object's occupied cell, toward the observer. */
  face(position: Point, observer: Point, blocking: boolean): Point {
    if (!blocking) return position;
    const dx = observer.x - position.x,
      dy = observer.y - position.y;
    if (Math.abs(dx) > Math.abs(dy))
      return {
        x: Math.floor(position.x) + (dx > 0 ? 1.012 : -0.012),
        y: position.y,
      };
    return {
      x: position.x,
      y: Math.floor(position.y) + (dy > 0 ? 1.012 : -0.012),
    };
  }
  reachable(position: Point, player: Point, blocking: boolean) {
    const p = this.face(position, player, blocking);
    return (
      Math.hypot(position.x - player.x, position.y - player.y) < 1.85 &&
      visible(player.x, player.y, p.x, p.y)
    );
  }
  exposure(position: Point, lamp: Lamp, blocking: boolean) {
    const p = this.face(position, lamp, blocking);
    return beam(lamp, p.x, p.y, 0.25);
  }
  nearby(player: Point, lamp: Lamp): (Item | Target) | undefined {
    const candidates: (Item | Target)[] = [
      ...this.items.filter((i) => i.location.kind === "world"),
      ...TARGETS.filter((t) => t.kind !== "door" || !this.active.has(t.id)),
    ];
    return candidates
      .filter((e) => {
        const p =
          "def" in e
            ? (e.location as { position: Point }).position
            : e.position;
        const block = "def" in e ? !!ITEMS[e.def].large : true;
        return (
          this.reachable(p, player, block) &&
          this.exposure(p, lamp, block) > 0.035
        );
      })
      .sort((a, b) => {
        const pos = (e: Item | Target) =>
          "def" in e
            ? (e.location as { position: Point }).position
            : e.position;
        return (
          Math.hypot(pos(a).x - player.x, pos(a).y - player.y) -
          Math.hypot(pos(b).x - player.x, pos(b).y - player.y)
        );
      })[0];
  }
  encode(player: Point, lightRequested: boolean): Save {
    return {
      version: SAVE_VERSION,
      map: "transport-1",
      player: { ...player },
      items: structuredClone(this.items),
      active: [...this.active],
      lightRequested,
    };
  }
  save(player: Point, lightRequested: boolean) {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(this.encode(player, lightRequested)),
      );
      this.saveWarning = "";
    } catch {
      this.saveWarning =
        "Local save unavailable. This session remains playable.";
    }
  }
  load(raw: string | null): { player: Point; lightRequested: boolean } | null {
    if (!raw) return null;
    const before = this.items,
      beforeActive = this.active;
    try {
      const data = JSON.parse(raw) as Save;
      if (
        data.version !== SAVE_VERSION ||
        data.map !== "transport-1" ||
        !Array.isArray(data.items) ||
        !Array.isArray(data.active) ||
        typeof data.lightRequested !== "boolean"
      )
        throw Error();
      const seed = seedItems(),
        ids = new Set<string>();
      if (data.items.length !== seed.length) throw Error();
      const point = (p: Point) =>
        p &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        material(p.x, p.y) !== 0;
      for (const i of data.items) {
        if (
          !i ||
          ids.has(i.id) ||
          !seed.some((s) => s.id === i.id && s.def === i.def) ||
          !i.location
        )
          throw Error();
        ids.add(i.id);
        const l = i.location;
        if (l.kind === "world") {
          if (!point(l.position)) throw Error();
        } else if (l.kind === "equipped") {
          if (!SLOTS.includes(l.slot)) throw Error();
        } else if (l.kind === "storage") {
          if (!TARGETS.some((t) => t.id === l.target && t.storage))
            throw Error();
        } else if (l.kind === "used") {
          if (l.target === "drink") {
            if (ITEMS[i.def].capability !== "drink") throw Error();
          } else if (
            !TARGETS.some(
              (t) =>
                t.id === l.target &&
                t.rule?.consume &&
                t.rule.capability === ITEMS[i.def].capability &&
                data.active.includes(t.id),
            )
          )
            throw Error();
        } else if (l.kind !== "inventory") throw Error();
      }
      if (
        data.active.some((id) => !TARGETS.some((t) => t.id === id)) ||
        new Set(data.active).size !== data.active.length ||
        !point(data.player)
      )
        throw Error();
      for (const t of TARGETS)
        if (
          data.active.includes(t.id) &&
          t.rule?.consume &&
          !data.items.some(
            (i) => i.location.kind === "used" && i.location.target === t.id,
          )
        )
          throw Error();
      if (data.active.includes("shutter") !== data.active.includes("drive"))
        throw Error();
      this.items = data.items;
      this.active = new Set(data.active);
      if (this.check()) throw Error();
      this.sync();
      // Reject overlapping physical objects and impossible item placements.
      const cells = new Set<string>();
      for (const t of TARGETS)
        if (t.kind !== "door" || !this.active.has(t.id))
          for (const p of t.cells || [t.position])
            cells.add(`${Math.floor(p.x)},${Math.floor(p.y)}`);
      for (const i of this.items)
        if (i.location.kind === "world") {
          const p = i.location.position,
            key = `${Math.floor(p.x)},${Math.floor(p.y)}`;
          if (cells.has(key)) throw Error();
          if (ITEMS[i.def].large) cells.add(key);
        }
      return {
        player: canStand(data.player.x, data.player.y)
          ? data.player
          : { ...spawn },
        lightRequested: data.lightRequested,
      };
    } catch {
      this.items = before;
      this.active = beforeActive;
      this.sync();
      this.saveWarning =
        "Incompatible or damaged save. Started a clean session.";
      return null;
    }
  }
}
