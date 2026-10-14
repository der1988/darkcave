import type { Point } from "./geometry";
import type { ClickerState } from "./clicker";
import type { SoundEvent } from "./throwables";
import type { Footstep } from "./clicker";
/** Audio starts only after a browser-approved user gesture. */
export class FootstepAudio {
  private nextCalls = new Map<number, number>();
  private noise: AudioBuffer | null = null;
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
  private burst(
    position: Point,
    listener: Point,
    frequency: number,
    duration: number,
    volume: number,
    delay = 0,
  ) {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") return;
    if (!this.noise) {
      this.noise = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * 0.4),
        ctx.sampleRate,
      );
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain(),
      pan = ctx.createStereoPanner();
    source.buffer = this.noise;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 2.5;
    const distance = Math.hypot(
        position.x - listener.x,
        position.y - listener.y,
      ),
      level = volume / (1 + distance * distance * 0.3);
    const time = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, level),
      time + 0.003,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    pan.pan.value = Math.max(
      -1,
      Math.min(1, (position.x - listener.x - (position.y - listener.y)) / 6),
    );
    source.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(ctx.destination);
    source.start(time);
    source.stop(time + duration);
  }
  impacts(sounds: SoundEvent[], listener: Point) {
    for (const sound of sounds) {
      if (sound.source === "bottle")
        for (let i = 0; i < 5; i++)
          this.burst(
            sound,
            listener,
            2500 + i * 700,
            0.08 + i * 0.025,
            0.09,
            i * 0.018,
          );
      else this.burst(sound, listener, 1300, 0.04, 0.06);
    }
  }
  clicker(dt: number, actor: ClickerState, listener: Point, id = 0) {
    if (!this.context || this.context.state !== "running") return;
    const next = (this.nextCalls.get(id) ?? 1 + id * 0.25) - dt;
    this.nextCalls.set(id, next);
    if (next > 0) return;
    this.nextCalls.set(id, actor.mode === "investigating" ? 1.3 : 2.8);
    // Original synthetic dry clicks followed by a low rasp; no sampled game audio.
    for (let i = 0; i < 4; i++)
      this.burst(actor, listener, 1300 + i * 260, 0.025, 0.15, i * 0.085);
    this.burst(actor, listener, 520, 0.28, 0.075, 0.36);
  }
}
