/// <reference types="vite/client" />

import type { Point } from "./world";

declare global {
  interface Window {
    __liminal?: {
      snapshot(): {
        player: Point;
        brother: Point;
        torchOn: boolean;
        angle: number;
      };
      place(position: Point): void;
    };
  }
}
