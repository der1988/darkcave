/// <reference types="vite/client" />
import type { Progress } from "./mechanisms";
import type { Throwable } from "./throwables";

import type { ClickerState } from "./clicker";
import type { DialogueLine } from "./dialogue";
import type { ActorState } from "./game";

declare global {
  interface Window {
    __liminal?: {
      advance(
        dt: number,
        horizontal: number,
        vertical: number,
        stealth: boolean,
      ): void;
      screenPoint(x: number, y: number, z?: number): { x: number; y: number };
      snapshot(): {
        player: ActorState;
        brother: ActorState;
        torchOn: boolean;
        clicker: ClickerState;
        clickers: ClickerState[];
        progress: Progress;
        dialogue: DialogueLine | null;
        objects: Throwable[];
        heldObject: Throwable | null;
        chargePower: number | null;
      };
    };
  }
}
