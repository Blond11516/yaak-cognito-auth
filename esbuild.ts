import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options: esbuild.BuildOptions = {
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "./build/index.js",
  platform: "node",
  target: "node22",
  define: { "import.meta.url": "_importMetaUrl" },
  plugins: [
    {
      name: "watch-logger",
      setup(build) {
        let count = 0;
        build.onEnd(() => {
          console.log(`Finished build ${count++}`);
        });
      },
    },
  ],
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch({});
  await new Promise(() => {});
} else {
  await esbuild.build(options);
}
