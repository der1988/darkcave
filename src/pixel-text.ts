/** Original 3×5 bitmap alphabet, drawn locally; no external font or license dependency. */
const glyphs: Record<string, string> = {
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "101111111111101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101111011",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "110001010100111",
  "3": "110001010001110",
  "4": "101101111001001",
  "5": "111100110001110",
  "6": "011100111101111",
  "7": "111001010010010",
  "8": "111101111101111",
  "9": "111101111001110",
  ".": "000000000000010",
  ",": "000000000010100",
  ":": "000010000010000",
  "?": "110001010000010",
  "'": "010010000000000",
  "!": "010010010000010",
  "—": "000000111000000",
  "-": "000000111000000",
};
export function pixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#c5c1a5",
) {
  ctx.fillStyle = color;
  let offset = 0;
  for (const ch of text.toUpperCase()) {
    const normalized = ch.normalize("NFD"),
      base = normalized[0],
      bits = glyphs[base] || "";
    for (let i = 0; i < bits.length; i++)
      if (bits[i] === "1")
        ctx.fillRect(
          Math.round(x) + offset + (i % 3),
          Math.round(y) + Math.floor(i / 3),
          1,
          1,
        );
    if (normalized.length > 1)
      ctx.fillRect(Math.round(x) + offset + 1, Math.round(y) - 2, 1, 1);
    offset += 4;
  }
}
export function speechLines(text: string, max = 45) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines;
}
