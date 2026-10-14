import { createToolchain } from "@live-codes/clang-wasm/toolchain";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../native/game.cpp", import.meta.url), "utf8");
const toolchain = await createToolchain();
try {
  const { runtime } = toolchain;
  await toolchain.lock(async () => {
    const built = await toolchain.captureCompilerOutput(async () => {
      await runtime.compile({
        input: "game.cpp",
        code: source,
        obj: "game.o",
        language: "CPP",
        compileArgs: ["-ffreestanding"],
        cppVersion: "20",
      });
      const linker = await runtime.getModule(runtime.assetUrls.lld);
      await runtime.run(
        linker,
        true,
        "wasm-ld",
        "--no-entry",
        "--export-all",
        "--strip-all",
        "game.o",
        "-o",
        "liminal-core.wasm",
      );
    });
    if (built.error) throw new Error(built.raw || built.error.message);
    const bytes = Uint8Array.from(runtime.memfs.getFileContents("liminal-core.wasm"));
    await mkdir(new URL("../public", import.meta.url), { recursive: true });
    await writeFile(new URL("../public/liminal-core.wasm", import.meta.url), bytes);
    console.log(`compiled native/game.cpp (${bytes.length} bytes)`);
  });
} finally {
  toolchain.dispose();
}
