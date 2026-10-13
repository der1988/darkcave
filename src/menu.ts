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
import { ZONES } from "./zones";
import type { Point } from "./light";
export type MenuKind = "inventory" | "character" | "help" | "map";
export type MenuAction = {
  type: "equip" | "unequip" | "drop" | "use" | "store" | "take";
  id: string;
  slot?: Slot;
  target?: string;
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
  private panel = el("section");
  private message = "";
  private priorFocus: HTMLElement | null = null;
  constructor(
    private state: () => Possessions,
    private act: (a: MenuAction) => string,
    private onChange: (open: boolean) => void,
    private targets: () => string[],
    private player: () => Point,
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
    if (this.kind === "map") {
      const c = el("canvas", "", frame);
      c.className = "exploration-map";
      c.setAttribute("aria-label", "Explored map");
      const zones = state.exploration.draw(c, this.player());
      el("p", "Pale square: you · Green: lit rooms · Black: unknown", frame);
      el("p", zones.map((z) => ZONES[z].name).join(" / "), frame);
      el(
        "p",
        "Only nearby, visible space is remembered. Fixed lighting keeps these rooms empty of creatures. Unvisited passages remain unknown.",
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
        "Two occupied hands need a body-mounted lamp. Cargo slows walking. Menus pause the world and its sounds. The inventory Map records visited space. Progress is stored on this browser.",
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
        if (d.actions.includes("store") && this.storage)
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
