import { compileSvelte } from "@/rendering/compile.ts";
import { removeCSR } from "@/rendering/filter.ts";
import purgecss from "@fullhuman/postcss-purgecss";
import resolve from "@rollup/plugin-node-resolve";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import autoprefixer from "autoprefixer";
import { readFileSync, writeFile } from "fs";
import path from "path";
import {
  preprocess,
  type CompileResult,
  type PreprocessorGroup,
  type Processed,
} from "svelte/compiler";
import { render } from "svelte/server";
import type { Config } from "tailwindcss";
import tailwindcss from "tailwindcss";
import { defineConfig, type Plugin } from "vite";

const svelteConfig = svelte({
  compilerOptions: { modernAst: true },
  prebundleSvelteLibraries: true,
});

let preprocessorConfig: PreprocessorGroup[] | null = null;

function getPreprocessorConfig(tailwindConfig?: Config) {
  if (preprocessorConfig) {
    return preprocessorConfig;
  } else if (tailwindConfig) {
    return setPreprocessorConfig(tailwindConfig);
  } else {
    throw new Error("Preprocessor config not set");
  }
}

export function setPreprocessorConfig(tailwindConfig?: Config) {
  return (preprocessorConfig = [
    removeCSR(),
    vitePreprocess({
      style: defineConfig({
        plugins: [svelteConfig, purgecss({}) as unknown as Plugin],
        css: {
          postcss: {
            plugins: [tailwindcss(tailwindConfig), autoprefixer()],
          },
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./"),
          },
        },
        build: {
          commonjsOptions: {
            include: [/linked-dep/, /node_modules/],
          },
          ssr: true,
          rollupOptions: {
            input: `./index.html`,
            output: {
              entryFileNames: `assets/[name].js`,
              chunkFileNames: `assets/[name].js`,
              assetFileNames: `assets/[name].[ext]`,
            },
            plugins: [
              resolve({
                browser: true,
                exportConditions: ["svelte"],
                extensions: [".svelte"],
              }),
            ],
          },
        },
      }),
    }),
  ]);
}

const svelteHeadTagRegex = /<svelte:head>([\s\S]*?)<\/svelte:head>/;

export async function compileForSsr(
  inPath: string,
  outPath: string,
  addLinkTag: boolean,
  compilePath: string,
) {
  let originalSource = readFileSync(inPath, "utf8");

  if (addLinkTag) {
    const headTag = originalSource.match(svelteHeadTagRegex);
    const linkTag = `<link rel="modulepreload" as="script" href="/assets/${path.basename(
      outPath,
    )}"/>`;
    if (headTag) {
      originalSource = originalSource.replace(
        headTag[0],
        `${headTag[0]}\n${linkTag}`,
      );
    } else {
      originalSource = originalSource.concat(
        `<svelte:head>${linkTag}</svelte:head>`,
      );
    }
  }

  const localFilename = path.basename(inPath);
  const { code }: Processed = await preprocess(
    originalSource,
    getPreprocessorConfig(),
    { filename: localFilename },
  );

  const { js }: CompileResult = compileSvelte(
    code,
    {
      filename: localFilename,
      generate: "ssr",
      dev: false,
      discloseVersion: false,
      modernAst: true,
    },
    outPath.replace(compilePath, ""),
  );

  await writeFile(outPath, js.code, () => {});
}

const headTagRegex = /<[^>]+>/g;
const htmlCommentRegex = /<!--[\s\S]*?-->/g;

export async function renderCompiled(jsFile: string) {
  const Component = (await import(path.join(process.cwd(), jsFile))).default;
  // TODO(czarlinski): maybe use injected https://svelte-5-preview.vercel.app/docs/breaking-changes
  const rendered: {
    html: string;
    head: string;
  } = render(Component, {});

  rendered.head = rendered.head.replaceAll(htmlCommentRegex, "");

  const headTags: Set<string> = new Set();
  let match;
  while ((match = headTagRegex.exec(rendered.head))) {
    headTags.add(match[0]);
  }
  rendered.head = Array.from(headTags).join("\n");

  return rendered;
}
