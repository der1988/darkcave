import type { Point } from "./light";
export const SLOTS = [
  "Head",
  "Torso",
  "Back",
  "Left hand",
  "Right hand",
  "Utility",
  "Cargo attachment",
] as const;
export type Slot = (typeof SLOTS)[number];
export const CATEGORIES = [
  "Tools",
  "Consumables",
  "Documents",
  "Equipment",
  "Cargo",
  "Memories",
] as const;
export type ItemDef = {
  name: string;
  category: (typeof CATEGORIES)[number];
  description: string;
  weight: number;
  bulk: number;
  icon: string[];
  slots?: Slot[];
  hands?: number;
  capacity?: number;
  bulkCapacity?: number;
  capability?: string;
  large?: boolean;
  furniture?: "cabinet" | "shelf" | "desk" | "crate" | "generator" | "lamp";
  storageCapacity?: number;
  footprint?: [number, number];
  actions: ("inspect" | "drop" | "store" | "equip" | "use")[];
};
const icons = {
  key: ["  ##    ", " #  #   ", "  ###   ", "    #   ", "    ##  "],
  box: [" ###### ", "#+++++# ", "#+++++# ", "#+++++# ", " ###### "],
  bag: ["  ####  ", " ##  ## ", " #++++# ", " #++++# ", " ###### "],
  note: [" ###### ", " #----# ", " #--  # ", " #----# ", " ###### "],
  tool: [" ##  ## ", "  ####  ", "   ##   ", "   ##   ", "   ##   "],
  cell: ["   ##   ", "  ####  ", "  #++#  ", "  #++#  ", "  ####  "],
};
export const ITEMS: Record<string, ItemDef> = {
  key: {
    name: "Service key",
    category: "Tools",
    description:
      "A small brass key stamped S-04. The service store lies beyond the long eastern gallery.",
    weight: 0.1,
    bulk: 1,
    icon: icons.key,
    capability: "service-key",
    actions: ["inspect", "drop", "store", "use"],
  },
  note: {
    name: "Transfer slip",
    category: "Documents",
    description:
      "S-04 / EAST SERVICE STORE. One electrical module for the southern underground drive. Follow the east gallery into the concrete service rooms. Deliver through the south corridor to the machine beside the shutter. Two hands required; a clip lamp is stored near the service cabinet.",
    weight: 0.01,
    bulk: 1,
    icon: icons.note,
    actions: ["inspect", "drop", "store"],
  },
  battery: {
    name: "Dry battery",
    category: "Consumables",
    description:
      "A sealed cell for a low-voltage terminal. Fits the unpowered service cabinet.",
    weight: 0.3,
    bulk: 1,
    icon: icons.cell,
    capability: "power",
    actions: ["inspect", "drop", "store", "use"],
  },
  tool: {
    name: "Maintenance tool",
    category: "Tools",
    description:
      "A blunt square driver. Hold it in either hand to release maintenance fasteners.",
    weight: 1.2,
    bulk: 2,
    icon: icons.tool,
    slots: ["Left hand", "Right hand"],
    capability: "fastener",
    actions: ["inspect", "drop", "store", "equip", "use"],
  },
  backpack: {
    name: "Canvas backpack",
    category: "Equipment",
    description:
      "Faded canvas. Adds 10 kg and six inventory spaces when worn on the back.",
    weight: 1,
    bulk: 2,
    icon: icons.bag,
    slots: ["Back"],
    capacity: 10,
    bulkCapacity: 6,
    actions: ["inspect", "drop", "store", "equip"],
  },
  harness: {
    name: "Cargo harness",
    category: "Equipment",
    description:
      "A torso harness with straps for a compact equipment case. Enables the cargo attachment slot.",
    weight: 1.4,
    bulk: 2,
    icon: icons.bag,
    slots: ["Torso"],
    capability: "harness",
    actions: ["inspect", "drop", "store", "equip"],
  },
  cliplight: {
    name: "Clip lamp",
    category: "Equipment",
    description:
      "A self-contained shoulder lamp. In the utility slot it leaves both hands free. Space still controls the light.",
    weight: 0.5,
    bulk: 1,
    icon: icons.cell,
    slots: ["Utility"],
    capability: "body-light",
    actions: ["inspect", "drop", "store", "equip"],
  },
  module: {
    name: "Electrical module",
    category: "Cargo",
    description:
      "A heavy drive module. Carry in both hands; it cannot fit in a bag. Install at the inactive machine in the underground, beside the sealed southern passage.",
    weight: 8,
    bulk: 10,
    icon: icons.box,
    slots: ["Left hand"],
    hands: 2,
    large: true,
    capability: "drive",
    actions: ["inspect", "drop", "store", "equip", "use"],
  },
  case: {
    name: "Equipment case",
    category: "Cargo",
    description:
      "A compact metal case. One hand, or a cargo harness attachment. Its mass changes your stride.",
    weight: 4,
    bulk: 5,
    icon: icons.box,
    slots: ["Left hand", "Right hand", "Cargo attachment"],
    hands: 1,
    large: true,
    actions: ["inspect", "drop", "store", "equip"],
  },
  water: {
    name: "Water flask",
    category: "Consumables",
    description:
      "A little water. A slow drink can settle your breathing, until danger returns.",
    weight: 0.6,
    bulk: 1,
    icon: icons.cell,
    capability: "drink",
    actions: ["inspect", "drop", "store", "use"],
  },
};
for (const [id, name, kind, weight, capacity, footprint] of [
  ["cabinet", "Mobiletto recuperabile", "cabinet", 6, 12, [1, 1]],
  ["shelf", "Scaffale basso", "shelf", 5, 8, [2, 1]],
  ["desk", "Piccola scrivania", "desk", 5, 2, [2, 1]],
  ["crate", "Cassetta di legno", "crate", 3, 6, [1, 1]],
  ["generator", "Generatore portatile", "generator", 7, 0, [1, 1]],
  ["standlamp", "Lampada da terra", "lamp", 3, 0, [1, 1]],
] as const)
  ITEMS[id] = {
    name,
    category: "Cargo",
    description: capacity
      ? kind==='crate' ? `Cassetta trasportabile: ${capacity} spazi. Il contenuto pesa mentre la porti.` : `Trasporta a casa e sistema sul pavimento. Contiene fino a ${capacity} spazi. Svuota prima di spostare.`
      : kind === "generator"
        ? "Alimenta le lampade recuperate. La luce di casa non dipende da questo generatore."
        : "Una lampada recuperata. Il generatore le restituisce luce.",
    weight,
    bulk: 10,
    icon: icons.box,
    slots: ["Left hand"],
    hands: 2,
    large: true,
    furniture: kind,
    storageCapacity: capacity,
    footprint: [...footprint],
    actions: ["inspect", "drop", "equip"],
  };
ITEMS.cup = {
  name: "Una tazza",
  category: "Memories",
  description: "Il bordo è scheggiato da una parte.",
  weight: 0.2,
  bulk: 1,
  icon: ["        ", " #####  ", " #   ## ", " #   ## ", " #####  "],
  capability: "memory",
  actions: ["inspect", "drop", "store", "use"],
};
ITEMS.photo = {
  name: "Una fotografia",
  category: "Memories",
  description: "Due figure davanti a una casa. Il resto è sfocato.",
  weight: 0.01,
  bulk: 1,
  icon: icons.note,
  capability: "memory",
  actions: ["inspect", "drop", "store", "use"],
};
export type Location =
  | { kind: "world"; position: Point }
  | { kind: "inventory" }
  | { kind: "equipped"; slot: Slot }
  | { kind: "storage"; target: string }
  | { kind: "used"; target: string };
export type Item = {
  id: string;
  def: string;
  location: Location;
  rotation?: 0 | 1;
};
export type Target = {
  id: string;
  name: string;
  position: Point;
  kind: "door" | "machine" | "cabinet" | "panel" | "computer" | "archive";
  description: string;
  cells?: Point[];
  storage?: boolean;
  capacity?: number;
  rule?: { capability: string; consume: boolean; equipped?: boolean };
  opens?: string;
};
export const TARGETS: Target[] = [
  {
    id: "home-computer",
    name: "Computer",
    position: { x: 36.5, y: 45.5 },
    kind: "computer",
    description: "LIMINAL — MEMORY ARCHIVE",
  },
  {
    id: "archive",
    name: "Archivio dei ricordi",
    position: { x: 34.5, y: 45.5 },
    kind: "archive",
    description: "Riportiamo qui le cose che ricordiamo.",
    rule: { capability: "memory", consume: true },
  },
  {
    id: "home-storage",
    name: "Armadio di casa",
    position: { x: 34.5, y: 49.5 },
    kind: "cabinet",
    storage: true,
    capacity: 12,
    description: "Le cose lasciate qui restano al sicuro.",
  },
  {
    id: "store-door",
    name: "S-04 service door",
    position: { x: 87.5, y: 45.5 },
    kind: "door",
    cells: [{ x: 87, y: 45 }],
    description: "A locked store. The key is stamped S-04.",
    rule: { capability: "service-key", consume: false },
  },
  {
    id: "shutter",
    name: "Underground shutter",
    position: { x: 64.5, y: 94.5 },
    kind: "door",
    cells: [
      { x: 63, y: 94 },
      { x: 64, y: 94 },
      { x: 65, y: 94 },
    ],
    description:
      "The drive is disconnected. Its machine stands just north of here.",
  },
  {
    id: "drive",
    name: "Inactive drive machine",
    position: { x: 62.5, y: 89.5 },
    kind: "machine",
    description:
      "An empty drive cradle. Requires an electrical module from S-04.",
    rule: { capability: "drive", consume: true },
    opens: "shutter",
  },
  {
    id: "cabinet",
    name: "Storage cabinet",
    position: { x: 60.5, y: 54.5 },
    kind: "cabinet",
    storage: true,
    description: "An empty cabinet. Objects left here stay here.",
  },
  {
    id: "service-cabinet",
    name: "Unpowered service cabinet",
    position: { x: 80.5, y: 48.5 },
    kind: "cabinet",
    storage: true,
    description: "A low-voltage lock. A dry battery should release it.",
    rule: { capability: "power", consume: true },
  },
  {
    id: "panel",
    name: "Maintenance panel",
    position: { x: 84.5, y: 42.5 },
    kind: "panel",
    storage: true,
    description:
      "Square fasteners. Equip a maintenance tool to open the compartment.",
    rule: { capability: "fastener", consume: false, equipped: true },
  },
];
export function seedItems(): Item[] {
  const world = (id: string, def: string, x: number, y: number): Item => ({
    id,
    def,
    location: { kind: "world", position: { x, y } },
  });
  return [
    world("memory-cup", "cup", 44.5, 12.5),
    world("memory-photo", "photo", 8.5, 49.5),
    world("f-cabinet", "cabinet", 79.5, 43.5),
    world("f-shelf", "shelf", 5.5, 63.5),
    world("f-desk", "desk", 15.5, 89.5),
    world("f-crate", "crate", 82.5, 25.5),
    world("f-generator", "generator", 88.5, 66.5),
    world("f-lamp", "standlamp", 90.5, 67.5),
    world("key-01", "key", 54.5, 53.5),
    world("note-01", "note", 52.5, 52.5),
    world("pack-01", "backpack", 56.5, 53.5),
    world("cell-01", "battery", 55.5, 55.5),
    world("cell-02", "battery", 78.5, 47.5),
    world("tool-01", "tool", 79.5, 46.5),
    world("lamp-01", "cliplight", 81.5, 46.5),
    world("module-01", "module", 92.5, 45.5),
    world("case-01", "case", 90.5, 74.5),
    world("water-01", "water", 50.5, 54.5),
    {
      id: "harness-01",
      def: "harness",
      location: { kind: "storage", target: "service-cabinet" },
    },
    {
      id: "water-02",
      def: "water",
      location: { kind: "storage", target: "panel" },
    },
  ];
}
