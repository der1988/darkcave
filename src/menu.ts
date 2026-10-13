import { CONTROLS, controlLabel } from "./controls";
import {
  ITEMS,
  SLOTS,
  CATEGORIES,
  TARGETS,
  type Item,
  type Slot,
} from "./items";
import { Possessions, owned } from "./possessions";
import { drawPlayer, type Appearance } from "./player-sprite";
import { HOME, LEVELS, inHome } from "./levels";
import { solid } from "./world";
import type { MapView } from "./exploration";
import { ZONES } from "./zones";
import type { Point } from "./light";
export type MenuKind =
  | "inventory"
  | "character"
  | "help"
  | "map"
  | "computer"
  | "placement";
export type MenuAction = {
  type:
    | "equip"
    | "unequip"
    | "drop"
    | "use"
    | "store"
    | "take"
    | "place"
    | "generator"
    | "reset"
    | "restore";
  id: string;
  slot?: Slot;
  target?: string;
  position?: Point;
  rotation?: 0 | 1;
};
const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text = "",
  parent?: HTMLElement,
) => {
  const n = document.createElement(tag);
  n.textContent = text;
  parent?.append(n);
  return n;
};
export function appearance(state: Possessions): Appearance {
  const eq = state.equipment;
  return {
    backpack: eq.some((i) => i.def === "backpack"),
    bodyLight: state.bodyLight,
    harness: eq.some((i) => i.def === "harness"),
    cargo: !!state.cargo,
    twoHanded: !!state.cargo && ITEMS[state.cargo.def].hands === 2,
    attached:
      state.cargo?.location.kind === "equipped" &&
      state.cargo.location.slot === "Cargo attachment",
    tool: eq.some((i) => i.def === "tool"),
  };
}
export class Menu {
  kind: MenuKind | null = null;
  storage: string | undefined;
  selected: string | undefined;
  private category = "All";
  private mapView: MapView | null = null;
  private rotation: 0 | 1 = 0;
  private confirmReset = false;
  private confirmRestore = false;
  private panel = el("section");
  private message = "";
  private priorFocus: HTMLElement | null = null;
  constructor(
    private state: () => Possessions,
    private act: (a: MenuAction) => string,
    private onChange: (open: boolean) => void,
    private targets: () => string[],
    private player: () => Point,
    private facing: () => number = () => 0,
  ) {
    this.panel.id = "management";
    this.panel.hidden = true;
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-modal", "true");
    this.panel.setAttribute("aria-label", "LIMINAL field interface");
    document.body.append(this.panel);
    this.panel.addEventListener("keydown", (e) => {
      if (
        e.key === "Tab" &&
        (e.target as HTMLElement).tagName === "BUTTON" &&
        e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        const b = [...this.panel.querySelectorAll("button")];
        const at = b.indexOf(e.target as HTMLButtonElement);
        b[(at - 1 + b.length) % b.length]?.focus();
      }
    });
  }
  toggle(kind: MenuKind, storage?: string) {
    if (this.kind === kind && this.storage === storage) {
      this.close();
      return;
    }
    this.priorFocus = document.activeElement as HTMLElement;
    this.kind = kind;
    this.storage = storage;
    this.message = "";
    this.panel.hidden = false;
    this.onChange(true);
    this.render();
    this.panel.querySelector("button")?.focus();
  }
  close() {
    this.confirmReset = false;
    this.confirmRestore = false;
    this.kind = null;
    this.storage = undefined;
    this.panel.hidden = true;
    this.onChange(false);
    this.priorFocus?.focus();
  }
  private button(label: string, parent: HTMLElement, fn: () => void) {
    const b = el("button", label, parent);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  private run(a: MenuAction) {
    this.message = this.act(a) || "Done.";
    this.render();
  }
  private icon(item: Item, parent: HTMLElement) {
    const c = el("canvas", "", parent);
    c.width = 8;
    c.height = 8;
    c.className = "item-icon";
    const ctx = c.getContext("2d")!;
    ITEMS[item.def].icon.forEach((r, y) =>
      [...r].forEach((v, x) => {
        if (v !== " ") {
          ctx.fillStyle = v === "+" ? "#545a49" : "#91917a";
          ctx.fillRect(x, y, 1, 1);
        }
      }),
    );
  }
  render() {
    if (!this.kind) return;
    const state = this.state();
    this.panel.replaceChildren();
    const frame = el("div", "", this.panel);
    frame.className = "menu-frame";
    const head = el("header", "", frame);
    el(
      "h1",
      this.kind === "help"
        ? "FIELD REFERENCE"
        : this.kind === "character"
          ? "PERSONAL EQUIPMENT"
          : this.kind === "computer"
            ? "LIMINAL — MEMORY ARCHIVE"
            : this.kind === "placement"
              ? "SISTEMA IN CASA"
              : this.kind === "map"
                ? "EXPLORED SPACES"
                : "CARRIED OBJECTS",
      head,
    );
    this.button("Close · ESC", head, () => this.close());
    const nav = el("nav", "", frame);
    for (const k of ["inventory", "map", "character", "help"] as const)
      this.button(
        k === "inventory"
          ? "Inventory"
          : k === "character"
            ? "Character"
            : k === "map"
              ? "Map"
              : "Help",
        nav,
        () => {
          this.kind = k;
          this.render();
        },
      );
    if (this.kind === "computer") {
      el("h2", LEVELS.surface.name, frame);
      el(
        "p",
        `STATUS: ${state.complete ? "COMPLETE" : "ACCESSIBLE"} · MEMORIES: ${state.delivered.length}/${LEVELS.surface.required.length}`,
        frame,
      );
      el(
        "p",
        "Trova la tazza nella stanza dei ricordi e riportala nella scatola accanto al computer.",
        frame,
      );
      for (const id of state.delivered)
        el("p", ITEMS[state.item(id)!.def].name, frame);
      el("h2", LEVELS.unknown.name, frame);
      el("p", `STATUS: ${state.complete ? "UNLOCKED" : "LOCKED"}`, frame);
      const next = this.button("LAYER 02", frame, () => {
        this.message = "Destinazione sbloccata, ma non ancora disponibile.";
        this.render();
      });
      next.disabled = !state.complete;
      this.button("Nuova partita", frame, () => {
        this.confirmReset = true;
        this.render();
      });
      if (this.confirmReset) {
        el(
          "p",
          "La partita attuale sarà conservata come copia di sicurezza locale.",
          frame,
        );
        this.button("Conferma nuova partita", frame, () =>
          this.run({ type: "reset", id: "" }),
        );
      }
      this.button("Ripristina copia precedente", frame, () => {
        this.confirmRestore = true;
        this.render();
      });
      if (this.confirmRestore) {
        el(
          "p",
          "Ripristina la copia salvata prima della nuova partita. Anche questa partita verrà conservata.",
          frame,
        );
        this.button("Conferma ripristino", frame, () =>
          this.run({ type: "restore", id: "" }),
        );
      }
      el("p", this.message, frame).setAttribute("role", "status");
      return;
    }
    if (this.kind === "placement") {
      el(
        "p",
        "Scegli una casella libera. Le vie di passaggio e l’ingresso devono restare accessibili.",
        frame,
      );
      this.button(`Ruota · ${this.rotation ? 90 : 0}°`, frame, () => {
        this.rotation = this.rotation ? 0 : 1;
        this.render();
      });
      const grid = el("div", "", frame);
      grid.className = "placement-grid";
      grid.style.gridTemplateColumns = `repeat(${HOME.w}, 1fr)`;
      for (let y = HOME.y; y < HOME.y + HOME.h; y++)
        for (let x = HOME.x; x < HOME.x + HOME.w; x++) {
          const b = this.button(solid(x, y) ? "■" : "·", grid, () => {
            this.message = this.act({
              type: "place",
              id: this.selected!,
              position: { x: x + 0.5, y: y + 0.5 },
              rotation: this.rotation,
            });
            if (!this.message) {
              this.message = "Sistemato.";
              this.kind = "inventory";
            }
            this.render();
          });
          b.setAttribute("aria-label", `Place at ${x}, ${y}`);
          b.disabled = solid(x, y);
        }
      el("p", this.message, frame).setAttribute("role", "status");
      return;
    }
    if (this.kind === "map") {
      this.mapView ||= {
        zoom: 5,
        center: { ...this.player() },
        angle: this.facing(),
      };
      this.mapView.angle = this.facing();
      el("h2", LEVELS[state.chapter.level].name, frame);
      const controls = el("div", "", frame);
      controls.className = "map-controls";
      const adjust = (zoom: number, dx = 0, dy = 0) => {
        this.mapView!.zoom = Math.max(
          2,
          Math.min(16, this.mapView!.zoom * zoom),
        );
        this.mapView!.center.x += dx;
        this.mapView!.center.y += dy;
        this.render();
      };
      this.button("Zoom +", controls, () => adjust(1.5));
      this.button("Zoom −", controls, () => adjust(1 / 1.5));
      for (const [label, dx, dy] of [
        ["←", -8, 0],
        ["→", 8, 0],
        ["↑", 0, -8],
        ["↓", 0, 8],
      ] as const)
        this.button(label, controls, () => adjust(1, dx, dy));
      this.button("Recenter", controls, () => {
        this.mapView!.center = { ...this.player() };
        this.render();
      });
      const c = el("canvas", "", frame);
      c.className = "exploration-map";
      c.setAttribute("aria-label", "Explored map");
      const redraw = () =>
        state.exploration.draw(c, this.player(), this.mapView!);
      const zones = redraw();
      let drag: { x: number; y: number } | null = null;
      c.addEventListener("pointerdown", (e) => {
        drag = { x: e.clientX, y: e.clientY };
        c.setPointerCapture(e.pointerId);
      });
      c.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const r = c.getBoundingClientRect();
        this.mapView!.center.x -=
          ((e.clientX - drag.x) * c.width) / r.width / this.mapView!.zoom;
        this.mapView!.center.y -=
          ((e.clientY - drag.y) * c.height) / r.height / this.mapView!.zoom;
        drag = { x: e.clientX, y: e.clientY };
        redraw();
      });
      c.addEventListener("pointerup", () => (drag = null));
      c.addEventListener("pointercancel", () => (drag = null));
      c.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          this.mapView!.zoom = Math.max(
            2,
            Math.min(16, this.mapView!.zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2)),
          );
          redraw();
        },
        { passive: false },
      );
      el(
        "p",
        "Pale square: you · Green: protected rooms · Black: unknown",
        frame,
      );
      el("p", zones.map((z) => ZONES[z].name).join(" / "), frame);
      el(
        "p",
        "Only architecture actually seen is remembered. Drag to pan; scroll to zoom. The map never shows enemies.",
        frame,
      );
      return;
    }
    if (this.kind === "help") {
      const dl = el("dl", "", frame);
      dl.className = "controls";
      for (const c of CONTROLS)
        if ("label" in c) {
          el("dt", controlLabel(c), dl);
          el("dd", c.description, dl);
        }
      el(
        "p",
        "Two occupied hands need a body-mounted lamp. Cargo slows walking. Menus pause the world and its sounds. The inventory Map records observed space; drag to pan and scroll to zoom. CTRL silences both brothers. The two small health bars represent the older and younger brother. Progress is stored on this browser.",
        frame,
      );
      return;
    }
    const info = el(
      "p",
      `${state.weight.toFixed(1)} / ${state.capacity} kg · Bag ${state.bulk} / ${state.bulkCapacity} · Hands ${state.hands} / 2 · Pace ${Math.round(state.speed * 100)}%`,
      frame,
    );
    info.className = "status";
    el(
      "p",
      state.canLight
        ? state.bodyLight
          ? "Shoulder lamp available; both hands may carry cargo."
          : "Handheld flashlight uses a free hand."
        : "Both hands occupied. Handheld flashlight unavailable: drop cargo or equip a clip lamp in Utility.",
      frame,
    );
    const layout = el("div", "", frame);
    layout.className = "menu-columns";
    if (this.kind === "character") {
      el(
        "p",
        `Salute · Fratello maggiore ${Math.round(state.chapter.health)}/100 · Fratello minore ${Math.round(state.chapter.childHealth)}/100`,
        frame,
      );
      const figure = el("div", "", layout);
      figure.className = "character-view";
      const c = el("canvas", "", figure);
      c.width = 32;
      c.height = 28;
      c.setAttribute("aria-label", "Player with current equipment");
      const context = c.getContext("2d")!;
      drawPlayer(
        context,
        16,
        24,
        {
          stride: 0,
          walking: false,
          motion: 0,
          time: 0,
          side: 1,
          back: false,
          profile: false,
          load: state.weight / state.capacity,
          action: 0,
          light: false,
        },
        appearance(state),
        (tone) =>
          `rgb(${tone},${Math.round(tone * 0.96)},${Math.round(tone * 0.81)})`,
      );
      for (const slot of SLOTS) {
        const i = state.equipment.find(
          (i) =>
            i.location.kind === "equipped" &&
            (i.location.slot === slot ||
              (slot === "Right hand" && ITEMS[i.def].hands === 2)),
        );
        const b = this.button(
          `${slot}: ${i ? ITEMS[i.def].name : "—"}`,
          figure,
          () => {
            if (i) {
              this.selected = i.id;
              this.render();
            }
          },
        );
        b.className = "slot";
      }
    }
    const list = el("div", "", layout);
    list.className = "item-list";
    const filters = el("div", "", list);
    filters.className = "filters";
    for (const cat of ["All", ...CATEGORIES]) {
      const b = this.button(cat, filters, () => {
        this.category = cat;
        this.render();
      });
      b.setAttribute("aria-pressed", String(cat === this.category));
    }
    const items = state.items.filter(
      (i) =>
        owned(i) ||
        (i.location.kind === "storage" && i.location.target === this.storage),
    );
    if (this.storage) {
      const furniture = state.item(this.storage);
      if (furniture && ITEMS[furniture.def].furniture) {
        el("h2", ITEMS[furniture.def].name, list);
        this.button("Sposta mobile", list, () =>
          this.run({ type: "take", id: furniture.id }),
        );
        if (furniture.def === "generator")
          this.button(
            state.chapter.generatorOn
              ? "Spegni generatore"
              : "Accendi generatore",
            list,
            () => this.run({ type: "generator", id: furniture.id }),
          );
      }
    }
    if (this.storage)
      el(
        "h2",
        TARGETS.find((t) => t.id === this.storage)?.name || "Storage",
        list,
      );
    for (const i of items.filter(
      (i) => this.category === "All" || ITEMS[i.def].category === this.category,
    )) {
      const b = this.button("", list, () => {
        this.selected = i.id;
        this.render();
      });
      b.className = "item-row";
      b.dataset.item = i.id;
      this.icon(i, b);
      el(
        "span",
        `${ITEMS[i.def].name} ×1 · ${ITEMS[i.def].weight} kg${i.location.kind === "storage" ? " [stored]" : i.location.kind === "equipped" ? " [equipped]" : ""}`,
        b,
      );
      b.setAttribute("aria-pressed", String(this.selected === i.id));
    }
    if (!items.length) el("p", "Nothing carried.", list);
    const detail = el("div", "", layout);
    detail.className = "item-detail";
    const i = items.find((i) => i.id === this.selected);
    if (i) {
      const d = ITEMS[i.def];
      el("h2", d.name, detail);
      el("p", d.description, detail);
      if (i.def === "crate" && owned(i))
        this.button("Apri cassetta", detail, () => {
          this.storage = i.id;
          this.selected = undefined;
          this.render();
        });
      if (d.furniture && owned(i) && inHome(this.player()))
        this.button("Sistema in casa", detail, () => {
          this.kind = "placement";
          this.render();
        });
      el(
        "p",
        `${d.category} · ${d.weight} kg · Bulk ${d.bulk} · Quantity 1`,
        detail,
      );
      if (i.location.kind === "storage")
        this.button("Take", detail, () =>
          this.run({ type: "take", id: i.id, target: this.storage }),
        );
      else {
        if (d.actions.includes("equip"))
          for (const slot of d.slots || [])
            this.button(`Equip · ${slot}`, detail, () =>
              this.run({ type: "equip", id: i.id, slot }),
            );
        if (i.location.kind === "equipped")
          this.button("Unequip", detail, () =>
            this.run({ type: "unequip", id: i.id }),
          );
        if (d.actions.includes("drop"))
          this.button("Drop", detail, () =>
            this.run({ type: "drop", id: i.id }),
          );
        if (
          d.actions.includes("store") &&
          this.storage &&
          state.storageAvailable(this.storage, this.player())
        )
          this.button("Store", detail, () =>
            this.run({ type: "store", id: i.id, target: this.storage }),
          );
        if (d.actions.includes("use")) {
          if (d.capability === "drink")
            this.button("Drink", detail, () =>
              this.run({ type: "use", id: i.id, target: "drink" }),
            );
          for (const target of this.targets()) {
            const t = TARGETS.find((t) => t.id === target)!;
            if (t.rule?.capability === d.capability)
              this.button(`Use · ${t.name}`, detail, () =>
                this.run({ type: "use", id: i.id, target }),
              );
          }
        }
      }
    } else el("p", "Select an object to inspect it.", detail);
    const message = el("p", this.message || state.saveWarning, frame);
    message.className = "menu-feedback";
    message.setAttribute("role", "status");
  }
}
