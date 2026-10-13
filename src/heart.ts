export const secondBeatDelay = (bpm: number) =>
  0.145 * Math.pow(70 / bpm, 0.25);
export class Heart {
  bpm = 70;
  phase = 0;
  beatAge = 10;
  beats = 0;
  private alarm = 0;
  private memory = 0;
  settle() {
    this.alarm = 70;
    this.memory = 0;
  }
  perceive(visible: boolean, pursuing: boolean, audible: number) {
    const target = visible
      ? pursuing
        ? 153
        : 130
      : audible > 0.015
        ? 85 + Math.min(1, audible) * 35
        : 70;
    if (target > 70 && target >= this.alarm) {
      this.alarm = target;
      this.memory = Math.max(this.memory, visible ? 4 : 1.6);
    }
  }
  update(dt: number, final = false): boolean {
    this.memory = Math.max(0, this.memory - dt);
    if (this.memory === 0)
      this.alarm += (70 - this.alarm) * (1 - Math.exp(-dt * 0.2));
    const target = final ? 160 : Math.max(70, this.alarm);
    this.bpm +=
      (target - this.bpm) *
      (1 - Math.exp(-dt * (target > this.bpm ? 0.55 : 0.09)));
    this.phase += (dt * this.bpm) / 60;
    this.beatAge += dt;
    if (this.phase >= 1) {
      this.phase %= 1;
      this.beatAge = (this.phase * 60) / this.bpm;
      this.beats++;
      return true;
    }
    return false;
  }
  waveform(): number {
    const a = this.beatAge;
    const pulse = (t: number) =>
      Math.exp(-Math.pow((t - 0.035) / 0.016, 2)) -
      0.42 * Math.exp(-Math.pow((t - 0.065) / 0.022, 2));
    return pulse(a) + 0.55 * pulse(a - secondBeatDelay(this.bpm));
  }
}
export class Capture {
  elapsed: number | null = null;
  start() {
    if (this.elapsed === null) this.elapsed = 0;
  }
  get silent() {
    return this.elapsed !== null && this.elapsed > 0.7;
  }
  get opacity() {
    return this.elapsed === null ? 0 : Math.min(1, this.elapsed / 0.7);
  }
  update(dt: number) {
    if (this.elapsed === null) return false;
    this.elapsed += dt;
    return this.elapsed >= 2.5;
  }
}
