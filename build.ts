await Bun.build({
  entrypoints: ["./rendering/main.ts"],
  outdir: "./dist",
  minify: true,
  target: "bun",
  packages: "bundle",
  sourcemap: "none",
  define: { "process.env.CSS_TRANSFORMER_WASM": "false" },
  external: ["vite"],
});
