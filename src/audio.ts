import { project, visible, material } from "./world";
import type { Point } from "./light";
import { zoneAt } from "./zones";
import { secondBeatDelay } from "./heart";
type Voice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode;
  filter: BiquadFilterNode;
  startedAt: number;
};
/** Procedural, local audio only. One AudioContext and bounded, self-cleaning voices. */
export class Sound {
  context: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices = new Set<Voice>();
  private foot: Voice | null = null;
  private childFoot: Voice | null = null;
  private creature: Voice | null = null;
  heartbeatCount = 0;
  footstepCount = 0;
  muted = false;
  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.38;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
  }
  get active() {
    return this.context?.state === "running" && !this.muted;
  }
  private play(
    duration: number,
    sample: (t: number) => number,
    volume: number,
    cutoff: number,
  ): Voice | null {
    const c = this.context;
    if (!c || !this.master || !this.active) return null;
    const buffer = c.createBuffer(
        1,
        Math.ceil(c.sampleRate * duration),
        c.sampleRate,
      ),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = sample(i / c.sampleRate);
    const source = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain(),
      pan = c.createStereoPanner();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(this.master);
    const voice = { source, filter, gain, pan, startedAt: c.currentTime };
    this.voices.add(voice);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
      this.voices.delete(voice);
      if (this.foot === voice) this.foot = null;
      if (this.childFoot === voice) this.childFoot = null;
      if (this.creature === voice) this.creature = null;
    };
    source.start();
    return voice;
  }
  heartbeat(bpm: number) {
    if (!this.active) return;
    const delay = secondBeatDelay(bpm);
    const beat = (t: number, f: number) =>
      t < 0
        ? 0
        : Math.sin(2 * Math.PI * (f * t - 12 * t * t)) *
          Math.sin((Math.min(1, t / 0.014) * Math.PI) / 2) *
          Math.exp(-t * 32);
    this.play(
      delay + 0.23,
      (t) => beat(t, 56) + 0.66 * beat(t - delay, 66),
      0.29 + (bpm - 70) * 0.0018,
      170,
    );
    this.heartbeatCount++;
  }
  step(position: Point, loudness = 1, child = false, listener?: Point) {
    if (!this.active) return;
    if (child) {
      this.childFoot?.source.stop();
      this.childFoot = null;
    } else this.stopSteps(false);
    const concrete =
      material(position.x, position.y) === 2 ||
      zoneAt(position.x, position.y) !== "yellow";
    const pitch = 0.92 + Math.random() * 0.16;
    let colored = 0;
    const voice = this.play(
      0.105,
      (t) => {
        colored = colored * 0.76 + (Math.random() * 2 - 1) * 0.24;
        return (
          (colored * 0.62 + Math.sin(t * 2 * Math.PI * 68 * pitch) * 0.16) *
          Math.sin((Math.PI * t) / 0.105) *
          Math.exp(-t * 24)
        );
      },
      (0.105 + Math.random() * 0.025) *
        (concrete ? 1 : 0.7) *
        loudness *
        (listener ? acoustics(listener, position).gain : 1),
      concrete ? 780 : 360,
    );
    if (child) this.childFoot = voice;
    else this.foot = voice;
    if (voice && listener)
      voice.pan.pan.value = acoustics(listener, position).pan;
    this.footstepCount++;
  }
  object(kind: "cloth" | "drop" | "mechanism") {
    const length = kind === "mechanism" ? 0.28 : kind === "drop" ? 0.18 : 0.09;
    let noise = 0;
    this.play(
      length,
      (t) => {
        noise = noise * 0.8 + (Math.random() * 2 - 1) * 0.2;
        return (
          (noise * 0.5 +
            Math.sin(t * 2 * Math.PI * (kind === "drop" ? 65 : 180)) * 0.13) *
          Math.sin((Math.PI * t) / length) *
          Math.exp(-t * 14)
        );
      },
      kind === "cloth" ? 0.065 : 0.16,
      kind === "mechanism" ? 900 : 400,
    );
  }
  musicLevel = 0;
  private musicClock = 0;
  private droneClock = 0;
  private ambienceClock = 0;
  music(dt: number, confirmed: boolean) {
    this.musicLevel +=
      (Number(confirmed) - this.musicLevel) *
      (1 - Math.exp(-dt * (confirmed ? 3 : 0.6)));
    this.musicClock -= dt;
    this.droneClock -= dt;
    if (this.musicLevel > 0.015 && this.musicClock <= 0) {
      this.musicClock = 0.23;
      this.play(
        0.12,
        (t) =>
          Math.tanh(
            Math.sin(2 * Math.PI * (62 * t - 60 * t * t)) * 2 +
              (Math.random() * 2 - 1) * 0.15,
          ) * Math.exp(-t * 35),
        0.043 * this.musicLevel,
        390,
      );
    }
    if (this.musicLevel > 0.015 && this.droneClock <= 0) {
      this.droneClock = 0.65;
      this.play(
        0.8,
        (t) =>
          (Math.sin(t * 2 * Math.PI * 38) +
            0.3 * Math.sin(t * 2 * Math.PI * 57)) *
          Math.sin((Math.PI * t) / 0.8),
        0.022 * this.musicLevel,
        110,
      );
    }
  }
  inhabitant(kind: "clicker" | "zombie", listener: Point, position: Point) {
    const a = acoustics(listener, position);
    if (a.gain < 0.004) return 0;
    const v = this.play(
      kind === "clicker" ? 0.3 : 0.8,
      (t) =>
        kind === "clicker"
          ? (Math.sin(t * 2 * Math.PI * 540) + (Math.random() * 2 - 1) * 0.6) *
            Math.exp(-((t * 17) % 1) * 15) *
            Math.exp(-t * 6)
          : Math.sin(t * 2 * Math.PI * 76 + Math.sin(t * 12)) *
            Math.sin((Math.PI * t) / 0.8),
      a.gain * 0.2,
      kind === "clicker" ? 1200 : a.cutoff,
    );
    if (v) v.pan.pan.value = a.pan;
    return this.active ? a.gain * 0.45 : 0;
  }
  ambience(dt: number, zone: string, powered: boolean) {
    this.ambienceClock -= dt;
    if (this.ambienceClock > 0) return;
    this.ambienceClock = 6 + Math.random() * 5;
    const f =
      zone === "service"
        ? 98
        : zone === "hotel"
          ? 71
          : zone === "underground"
            ? 43
            : powered
              ? 62
              : 117;
    this.play(
      1.4,
      (t) =>
        (Math.sin(t * 2 * Math.PI * f) * 0.3 + (Math.random() * 2 - 1) * 0.08) *
        Math.sin((Math.PI * t) / 1.4),
      0.017,
      240,
    );
  }
  stopSteps(all = true) {
    if (all && this.childFoot) {
      this.childFoot.source.stop();
      this.childFoot = null;
    }
    if (this.foot) {
      this.foot.source.stop();
      this.foot = null;
    }
  }
  vocalize() {
    if (this.creature || !this.active) return;
    let breath = 0;
    const pitch = 39 + Math.random() * 13;
    this.creature = this.play(
      2.8,
      (t) => {
        breath = breath * 0.94 + (Math.random() * 2 - 1) * 0.06;
        const envelope = Math.pow(Math.sin((Math.PI * t) / 2.8), 2);
        const phase = 2 * Math.PI * pitch * t + 2.3 * Math.sin(t * 4.1);
        return (
          envelope *
          (0.35 * Math.sin(phase) +
            0.15 * Math.sin(phase * 2.03) +
            breath * 0.9) *
          (0.8 + 0.2 * Math.sin(t * 19))
        );
      },
      0,
      650,
    );
  }
  /** Perception is derived from the same gain used by the playing voice, not AI state. */
  spatial(listener: Point, source: Point): number {
    if (!this.creature || !this.active) return 0;
    const { gain, pan, cutoff } = acoustics(listener, source);
    const now = this.context!.currentTime;
    this.creature.gain.gain.setTargetAtTime(gain * 0.65, now, 0.08);
    this.creature.pan.pan.setTargetAtTime(pan, now, 0.08);
    this.creature.filter.frequency.setTargetAtTime(cutoff, now, 0.08);
    const age = Math.min(2.8, now - this.creature.startedAt);
    return gain * Math.sin((Math.PI * age) / 2.8) ** 2;
  }
  silence() {
    this.muted = true;
    for (const voice of this.voices) voice.source.stop();
    this.foot = null;
    this.childFoot = null;
    this.creature = null;
  }
  reset() {
    this.silence();
    this.muted = false;
    this.musicLevel = 0;
    this.musicClock = 0;
    this.droneClock = 0;
    this.heartbeatCount = 0;
    this.footstepCount = 0;
  }
  suspend() {
    this.stopSteps();
    void this.context?.suspend();
  }
}

export function acoustics(listener: Point, source: Point) {
  const distance = Math.hypot(source.x - listener.x, source.y - listener.y);
  const clear = visible(listener.x, listener.y, source.x, source.y);
  const relative = project(source.x - listener.x, source.y - listener.y);
  return {
    gain: Math.max(0, 1 - distance / 24) ** 2 * (clear ? 1 : 0.23),
    pan: Math.max(-0.95, Math.min(0.95, relative.x / 260)),
    cutoff: clear ? 900 : 230,
  };
}
