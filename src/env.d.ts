/// <reference types="vite/client" />

import type { ClickerState } from "./clicker";
import type { DialogueLine } from "./dialogue";
import type { ActorState } from "./game";

declare global {
  interface Window {
    __liminal?: {
      snapshot(): {
        player: ActorState;
        brother: ActorState;
        torchOn: boolean;
        clicker: ClickerState;
        dialogue: DialogueLine | null;
      };
    };
  }
}
