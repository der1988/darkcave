/// <reference types="vite/client" />

import type { ActorState } from "./native";

declare global {
  interface Window {
    __liminal?: {
      snapshot(): {
        player: ActorState;
        brother: ActorState;
        torchOn: boolean;
        angle: number;
        lightRange: number;
      };
    };
  }
}
