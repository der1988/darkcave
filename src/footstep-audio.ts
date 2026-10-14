import type { Footstep } from "./clicker";
/** Audio starts only after a browser-approved user gesture. */
export class FootstepAudio {
  private context: AudioContext | null = null;
  unlock() {
    this.context ??= new AudioContext();
    void this.context.resume().catch(() => {});
  }
  play(steps: Footstep[]) {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") return;
    for (const step of steps) {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        step.source === "player" ? 85 : 105,
        ctx.currentTime,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        40,
        ctx.currentTime + 0.09,
      );
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.13);
    }
  }
}
