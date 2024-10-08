// @ts-ignore
import commandLineArgs from "command-line-args";
import { chdir, cwd } from 'node:process';
import { main, type Args } from "./render.ts";


type OptionDefinition = {
  name: string;
  type: Function;
  alias?: string;
  multiple?: boolean;
  lazyMultiple?: boolean;
  defaultOption?: boolean;
  defaultValue?: any;
  group?: string | string[];
};

const optionDefinitions: OptionDefinition[] = [
  {
    name: "componentPath",
    type: String,
    alias: "i",
    defaultValue: "./src/lib/",
  },
  {
    name: "compilePath",
    type: String,
    alias: "o",
    defaultValue: "./compile/",
  },
  {
    name: "tailwindConfig",
    type: String,
    alias: "t",
    defaultValue: "tailwind.config.ts",
  },
  {
    name: "clean",
    type: Boolean,
    alias: "c",
    defaultValue: false,
  },
];

const options: Args = commandLineArgs(optionDefinitions);

chdir(cwd());

main(options);
