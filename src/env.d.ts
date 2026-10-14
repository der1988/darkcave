/// <reference types="vite/client" />

import type { ActorState } from "./game";

declare global {
  interface Window {
    __liminal?: {
      snapshot(): {
        player: ActorState;
        brother: ActorState;
        torchOn: boolean;
      };
    };
  }
}
