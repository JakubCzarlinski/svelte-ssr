// @ts-ignore
import { parse } from "@/node_modules/svelte/src/compiler/phases/1-parse/index.js";
// @ts-ignore
import { remove_typescript_nodes } from "@/node_modules/svelte/src/compiler/phases/1-parse/remove_typescript_nodes.js";
// @ts-ignore
import { analyze_component } from "@/node_modules/svelte/src/compiler/phases/2-analyze/index.js";
// @ts-ignore
import { transform_component } from "@/node_modules/svelte/src/compiler/phases/3-transform/index.js";
import {
  reset,
  reset_warning_filter, // @ts-ignore
} from "@/node_modules/svelte/src/compiler/state.js";
// @ts-ignore
import { validate_component_options } from "@/node_modules/svelte/src/compiler/validate-options.js";
// @ts-ignore
import { walk as estree_walk } from "estree-walker";
import path from "path";
import type { AST, CompileOptions, CompileResult } from "svelte/compiler";
import { walk as zimmerframe_walk } from "zimmerframe";

const importFormat = /@\/([a-zA-Z0-9_\/]+)\.(svelte)(?!\.)/g;
const importFormatKeepExt = /@\/([a-zA-Z0-9_\/]+)\.(mjs|cjs|js)/g;

export function compileSvelte(
  source: string,
  options: CompileOptions,
  localPath: string,
  componentPath: string
): CompileResult {
  reset_warning_filter(options.warningFilter);
  const validated = validate_component_options(options, "");
  reset(source, validated);

  let parsed: AST.Root = parse(source);

  const { customElement: customElementOptions, ...parsed_options } =
    parsed.options || {};

  const combined_options = {
    ...validated,
    ...parsed_options,
    customElementOptions,
  };

  parsed = replaceImports(parsed, localPath, componentPath);

  // @ts-ignore
  if (parsed.metadata.ts) {
    parsed = {
      ...parsed,
      fragment: parsed.fragment && remove_typescript_nodes(parsed.fragment),
      instance: parsed.instance && remove_typescript_nodes(parsed.instance),
      module: parsed.module && remove_typescript_nodes(parsed.module),
    };
  }

  const analysis = analyze_component(parsed, source, combined_options);
  const result = transform_component(analysis, source, combined_options);

  result.ast = to_public_ast(parsed);
  return result;
}

function to_public_ast(ast: any) {
  const clean = (node: { metadata: any; parent: any }) => {
    delete node.metadata;
    delete node.parent;
  };

  // @ts-ignore
  ast.options?.attributes.forEach((attribute) => {
    clean(attribute);
    clean(attribute.value);
    if (Array.isArray(attribute.value)) {
      attribute.value.forEach(clean);
    }
  });

  // remove things that we don't want to treat as public API
  return zimmerframe_walk(ast, null, {
    _(node, { next }) {
      clean(node);
      next();
    },
  });
}

function replaceImports(
  ast: any,
  localPath: string,
  componentPath: string
): any {
  return estree_walk(ast, {
    // @ts-ignore
    enter(node, _parent) {
      if (node.type === "ImportDeclaration") {
        if (!node.source.value || !node.source.raw) {
          return;
        }
        const matched = node.source.value.match(importFormat);
        if (matched) {
          node.source.value = node.source.value.replace(
            importFormat,
            (_: string, filepath: string, _ext: string) => {
              return formatRelativePath(
                filepath,
                localPath,
                "js",
                componentPath
              );
            }
          );
          node.source.raw = node.source.raw.replace(
            importFormat,
            (_: string, filepath: string, _ext: string) => {
              return formatRelativePath(
                filepath,
                localPath,
                "js",
                componentPath
              );
            }
          );

          node.source.value = node.source.value.replace(
            importFormatKeepExt,
            (_: string, filepath: string, ext: string) => {
              return formatRelativePath(
                filepath,
                localPath,
                ext,
                componentPath
              );
            }
          );
          node.source.raw = node.source.raw.replace(
            importFormatKeepExt,
            (_: string, filepath: string, ext: string) => {
              return formatRelativePath(
                filepath,
                localPath,
                ext,
                componentPath
              );
            }
          );
        } else {
          const resolved = require.resolve(node.source.value, {
            paths: [path.dirname(localPath)],
          });
          const relativePath = path
            .relative(path.dirname(localPath), resolved)
            .replaceAll(path.sep, path.posix.sep);

          node.source.value = `../${relativePath}`;
          node.source.raw = `"../${relativePath}"`;
        }
      }
    },
  });
}

function formatRelativePath(
  filepath: string,
  localPath: string,
  ext: string,
  componentPath: string
) {
  const relativePath = path
    .relative(path.dirname(localPath), path.join(filepath))
    .replaceAll(path.sep, path.posix.sep)
    .replaceAll(componentPath, "");

  return `./${relativePath}.${ext}`;
}
