import {
  copyFileSync,
  Dirent,
  existsSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  writeFile,
} from "fs";
import path from "path";
import type { Config } from "tailwindcss";
import { compileForSsr, renderCompiled, setPreprocessorConfig } from "./ssr.ts";

export type Args = {
  componentPath: string;
  compilePath: string;
  tailwindConfig: string;
  clean: boolean;
};

const permittedExtensions = [
  ".svelte",
  ".js",
  ".cjs",
  ".mjs",
  ".css",
  ".html",
  ".json",
];

export async function main({
  componentPath,
  compilePath,
  tailwindConfig,
  clean,
}: Args) {
  // Set the process location to where the file was called from
  const loadConfig = new Promise((resolve: (config: Config) => void) => {
    import(path.join(process.cwd(), tailwindConfig)).then((config) => {
      resolve(config.default as Config);
    });
  });

  if (!existsSync(compilePath)) {
    mkdirSync(compilePath, { recursive: true });
  } else if (clean) {
    rmdirSync(compilePath, { recursive: true });
    mkdirSync(compilePath, { recursive: true });
  }

  const filesOrDirs: Dirent[] = readdirSync(componentPath, {
    recursive: true,
    withFileTypes: true,
  });
  const files = findFiles(filesOrDirs, componentPath);
  const svelteFiles = [];

  // Find svelte files and copy other files to the output directory
  const fileCopies: Promise<any>[] = [];
  for (const file of files) {
    const directory = path.dirname(file);
    if (directory !== ".") {
      const dirPath = path.join(compilePath, directory);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    }
    if (file.endsWith(".svelte")) {
      svelteFiles.push(file);
      continue;
    }
    fileCopies.push(
      new Promise((resolve) => {
        copyFileSync(`${componentPath}${file}`, `${compilePath}${file}`);
        resolve(true);
      })
    );
  }
  await Promise.all(fileCopies);

  setPreprocessorConfig(await loadConfig);

  await compileAll(svelteFiles, componentPath, compilePath);
  await renderAll(svelteFiles, compilePath);
}

function renderAll(svelteFiles: string[], compilePath: string) {
  const promiseArray: Promise<void>[] = [];
  for (let i = 0; i < svelteFiles.length; i++) {
    const outfileWithoutExt = compilePath + svelteFiles[i].split(".")[0];
    promiseArray.push(
      renderCompiled(outfileWithoutExt + ".js").then(async (rendered) => {
        await writeRenderedFiles(rendered, outfileWithoutExt);
      })
    );
  }
  return Promise.all(promiseArray);
}

function writeRenderedFiles(
  rendered: { html: string; head: string },
  outfileWithoutExt: string
) {
  let done = 0;
  const onDone = (resolve: (value: boolean | PromiseLike<boolean>) => void) => {
    done++;
    if (done === 2) return resolve(true);
  };
  return new Promise<boolean>((resolve) => {
    writeFile(outfileWithoutExt + ".html", rendered.html, () =>
      onDone(resolve)
    );
    writeFile(outfileWithoutExt + ".head", rendered.head, () =>
      onDone(resolve)
    );
  });
}

function compileAll(
  svelteFiles: string[],
  componentPath: string,
  compilePath: string
) {
  const promiseArray: Promise<boolean>[] = [];
  for (let i = 0; i < svelteFiles.length; i++) {
    const file = svelteFiles[i];
    const filenameWitoutExt = file.split(".")[0];
    const filePath = componentPath + file;
    const outFilename = compilePath + filenameWitoutExt + ".js";
    promiseArray.push(
      compileForSsr(
        filePath,
        outFilename,
        true,
        compilePath,
        componentPath.slice(2)
      )
    );
  }
  return Promise.all(promiseArray);
}

function findFiles(filesOrDirs: Dirent[], componentPath: string) {
  let file = "";
  let dir = "";
  let joined = "";

  const files = [];
  for (let i = 0; i < filesOrDirs.length; i++) {
    const dirEntry = filesOrDirs[i];
    if (!dirEntry.isFile()) {
      continue;
    }

    for (const ext of permittedExtensions) {
      if (!dirEntry.name.endsWith(ext)) {
        continue;
      }

      // Remove src/lib/ prefix
      dir = dirEntry.parentPath
        .replaceAll(path.sep, path.posix.sep)
        .replaceAll(componentPath.slice(2, -1), "");

      file = dirEntry.name.replaceAll(path.sep, path.posix.sep);
      if (file.startsWith("/")) {
        file = file.slice(1);
      }

      joined = path.join(dir, file).replaceAll(path.sep, path.posix.sep);
      if (joined.startsWith("/")) {
        joined = joined.slice(1);
      }
      files.push(joined);
      break;
    }
  }

  return files;
}
