import type { Heart } from "./heart";
export class Hud {
  private samples: number[] = Array(58).fill(0);
  private elapsed = 0;
  update(dt: number, heart: Heart) {
    this.elapsed += dt;
    while (this.elapsed >= 1 / 45) {
      this.elapsed -= 1 / 45;
      this.samples.push(heart.waveform());
      this.samples.shift();
    }
  }
  reset() {
    this.samples.fill(0);
    this.elapsed = 0;
  }
  draw(ctx: CanvasRenderingContext2D, heart: Heart, height: number) {
    const x = 10,
      y = height - 31;
    ctx.fillStyle = "#060807";
    ctx.fillRect(x - 3, y - 3, 102, 27);
    // A hand-pixelled face, kept separate from the tiny in-world silhouette.
    const portrait = [
      "  33333  ",
      " 3444433 ",
      " 3444443 ",
      " 3424243 ",
      " 3444443 ",
      "  44443  ",
      "   443   ",
      "  22222  ",
      " 2222222 ",
    ];
    const colors = ["#000", "#101713", "#282e26", "#42483b", "#777b64"];
    portrait.forEach((row, j) =>
      [...row].forEach((p, i) => {
        if (p !== " ") {
          ctx.fillStyle = colors[+p];
          ctx.fillRect(x + i, y + j * 2, 1, 2);
        }
      }),
    );
    ctx.fillStyle = "#888c73";
    ctx.font = "8px monospace";
    ctx.textBaseline = "top";
    ctx.fillText(`${Math.round(heart.bpm)} BPM`, x + 17, y);
    ctx.fillStyle = "#4b5546";
    this.samples.forEach((v, i) =>
      ctx.fillRect(x + 17 + i, y + 17 - Math.round(v * 6), 1, 1),
    );
  }
}
