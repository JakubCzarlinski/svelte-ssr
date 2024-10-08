import { type PreprocessorGroup } from "svelte/compiler";

const csrRegexHTML =
  /<!--\s+CSR\s+-->([\s\S]*?)<!--\s+SSR\s+-->([\s\S]*?)<!--\s+END\s+-->/gm;
const csrRegexJS = /\/\/\s+CSR\s*([\s\S]*?)\/\/\s+SSR\s*([\s\S]*?)\/\/\s+END/gm;

function removeSsrInJs(content: string) {
  return content.replaceAll(
    csrRegexJS,
    (_: string, csr: string, _ssr: string) => csr,
  );
}

function removeSsrInHtml(content: string) {
  return content.replaceAll(
    csrRegexHTML,
    (_: string, csr: string, _ssr: string) => csr,
  );
}

export function removeSSR(): PreprocessorGroup {
  return {
    markup({ content }: { content: string }) {
      return {
        code: removeSsrInJs(removeSsrInHtml(content)),
      };
    },
  };
}

function removeCsrInJs(content: string) {
  return content.replaceAll(
    csrRegexJS,
    (_: string, _csr: string, ssr: string) => ssr,
  );
}

function removeCsrInHtml(content: string) {
  return content.replaceAll(
    csrRegexHTML,
    (_: string, _csr: string, ssr: string) => ssr,
  );
}

export function removeCSR(): PreprocessorGroup {
  return {
    markup({ content }: { content: string }) {
      return {
        code: removeCsrInJs(removeCsrInHtml(content)),
      };
    },
  };
}
