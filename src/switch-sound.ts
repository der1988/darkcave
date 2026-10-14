let audio: AudioContext | undefined;

export function playSwitchClick(turningOn: boolean) {
  audio ??= new AudioContext();
  void audio.resume();
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(turningOn ? 980 : 720, now);
  oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.025);
  gain.gain.setValueAtTime(0.035, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.04);
}
