export type DialogueLine = { speaker: "player" | "brother"; text: string };
const EXCHANGES: DialogueLine[][] = [
  [
    { speaker: "brother", text: "Perché sono tutti chiusi?" },
    { speaker: "player", text: "Non lo so. Stammi vicino." },
  ],
  [
    { speaker: "brother", text: "Sembra che siano andati via tutti." },
    { speaker: "player", text: "Troveremo un'uscita." },
  ],
  [
    { speaker: "brother", text: "Hai sentito anche tu?" },
    { speaker: "player", text: "Piano. Facciamo meno rumore." },
  ],
  [
    { speaker: "brother", text: "Non lasciarmi qui." },
    { speaker: "player", text: "Sono qui, accanto a te." },
  ],
];
export class Dialogue {
  private countdown = 2;
  private exchange = 0;
  private line = 0;
  private active: DialogueLine | null = null;
  private remaining = 0;
  snapshot() {
    return this.active ? { ...this.active } : null;
  }
  update(dt: number, stealth: boolean) {
    if (this.active) {
      this.remaining -= dt;
      if (this.remaining > 0) return;
      this.active = null;
      this.countdown = 0.8;
      return;
    }
    this.countdown -= dt;
    if (this.countdown > 0) return;
    const lines = EXCHANGES[this.exchange];
    if (this.line >= lines.length) {
      this.line = 0;
      this.exchange = (this.exchange + 1) % EXCHANGES.length;
      this.countdown = stealth ? 35 : 22;
      return;
    }
    this.active = lines[this.line++];
    this.remaining = 3.5;
  }
}
