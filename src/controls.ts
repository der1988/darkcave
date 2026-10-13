export const CONTROLS = [
  {
    action: "up",
    codes: ["KeyW", "ArrowUp"],
    label: "WASD / Arrow Keys",
    description: "Move",
  },
  { action: "down", codes: ["KeyS", "ArrowDown"] },
  { action: "left", codes: ["KeyA", "ArrowLeft"] },
  { action: "right", codes: ["KeyD", "ArrowRight"] },
  { action: "aim", codes: [], label: "Mouse", description: "Aim flashlight" },
  {
    action: "light",
    codes: ["Space"],
    label: "SPACE",
    description: "Toggle flashlight",
  },
  {
    action: "interact",
    codes: ["KeyE"],
    label: "E",
    description: "Interact / Pick up / Use",
  },
  {
    action: "inventory",
    codes: ["KeyI", "Tab"],
    label: "I / TAB",
    description: "Open inventory · Map tab: explored architecture",
  },
  {
    action: "character",
    codes: ["KeyC"],
    label: "C",
    description: "Character and equipment",
  },
  {
    action: "fast",
    codes: ["ShiftLeft", "ShiftRight"],
    label: "SHIFT",
    description: "Move faster (when load permits)",
  },
  {
    action: "silent",
    codes: ["ControlLeft", "ControlRight"],
    label: "CTRL",
    description: "Silent movement (takes priority over running)",
  },
  {
    action: "help",
    codes: ["KeyH"],
    label: "H",
    description: "Show / Hide help",
  },
  {
    action: "close",
    codes: ["Escape"],
    label: "ESC",
    description: "Close current menu",
  },
] as const;
export type Action = (typeof CONTROLS)[number]["action"];
export const actionFor = (code: string) =>
  CONTROLS.find((c) => (c.codes as readonly string[]).includes(code))?.action;
export const held = (keys: Set<string>, action: Action) =>
  CONTROLS.some(
    (c) => c.action === action && c.codes.some((code) => keys.has(code)),
  );
/** Help labels derive from the same key codes as input, including rebinding. */
export function controlLabel(control: (typeof CONTROLS)[number]): string {
  const display = (code: string) =>
    code.startsWith("Key")
      ? code.slice(3)
      : code.startsWith("Shift")
        ? "SHIFT"
        : code.startsWith("Control")
          ? "CTRL"
          : code === "Escape"
            ? "ESC"
            : code.toUpperCase();
  if (control.action === "aim") return "Mouse";
  if (control.action === "up") {
    const movement = CONTROLS.filter((c) =>
      ["up", "down", "left", "right"].includes(c.action),
    ).flatMap((c) => [...c.codes]);
    const letters = movement.filter((c) => c.startsWith("Key")).map(display);
    return `${["W", "A", "S", "D"].every((k) => letters.includes(k)) && letters.length === 4 ? "WASD" : letters.join(" / ")} / Arrow Keys`;
  }
  return [...new Set(control.codes.map(display))].join(" / ");
}
