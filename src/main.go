package main

import (
	"fmt"
	"os"
	"svelte-ssr/src/render"

	"flag"
)

var callFromPath string
var componentPath string
var compilePath string
var tailwindConfig string
var clean bool

type Command[T any] struct {
	Name        string
	Alias       string
	Description string
	BoundTo     *T
	Default     T
}

func init() {
	cwd, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	stringCommands := []Command[string]{
		{
			BoundTo:     &componentPath,
			Name:        "componentPath",
			Alias:       "i",
			Description: "Path to the Svelte components, the input directory.",
			Default:     "./src/lib/",
		},
		{
			BoundTo:     &compilePath,
			Name:        "compilePath",
			Alias:       "o",
			Description: "Path to output compiled HTML.",
			Default:     "./compile/",
		},
		{
			BoundTo:     &tailwindConfig,
			Name:        "tailwindConfig",
			Alias:       "t",
			Description: "Path to Tailwind CSS configuration file.",
			Default:     "tailwind.config.ts",
		},
		{
			BoundTo:     &callFromPath,
			Name:        "callFromPath",
			Alias:       "d",
			Description: "Path from which the command is called, used for relative paths.",
			Default:     cwd,
		},
	}
	for _, cmd := range stringCommands {
		flag.StringVar(cmd.BoundTo, cmd.Name, cmd.Default, cmd.Description)
		if cmd.Alias != "" {
			flag.StringVar(cmd.BoundTo, cmd.Alias, cmd.Default, cmd.Description)
		}
	}

	boolCommands := []Command[bool]{
		{
			BoundTo:     &clean,
			Name:        "clean",
			Alias:       "c",
			Description: "Clean the output directory before compiling.",
			Default:     false,
		},
	}
	for _, cmd := range boolCommands {
		flag.BoolVar(cmd.BoundTo, cmd.Name, cmd.Default, cmd.Description)
		if cmd.Alias != "" {
			flag.BoolVar(cmd.BoundTo, cmd.Alias, cmd.Default, "Alias for -"+cmd.Name+".")
		}
	}
	flag.Parse()
	// Make sure that only one of each command is set.
}

func main() {
	renderConfig := render.RenderConfig{
		ComponentPath:  componentPath,
		CompilePath:    compilePath,
		TailwindConfig: tailwindConfig,
		CallFromPath:   callFromPath,
		Clean:          clean,
	}

	// Check if the directories are valid.
	if err := validateDir(renderConfig.CallFromPath, "call from"); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	if err := os.Chdir(renderConfig.CallFromPath); err != nil {
		fmt.Printf("Could not change directory to %s: %v.\n", renderConfig.CallFromPath, err.Error())
		os.Exit(1)
	}

	if err := validateDir(renderConfig.ComponentPath, "input"); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	if err := validateDir(renderConfig.TailwindConfig, "tailwind config"); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	if renderConfig.Clean {
		if err := os.RemoveAll(renderConfig.CompilePath); err != nil {
			fmt.Printf("Could not clean compile path %s: %v.\n", renderConfig.CompilePath, err.Error())
			os.Exit(1)
		}
	}
	if err := os.MkdirAll(renderConfig.CompilePath, 0755); err != nil {
		fmt.Printf("Could not create compile path %s: %v.\n", renderConfig.CompilePath, err.Error())
		os.Exit(1)
	}
	render.Render(&renderConfig)
}

func validateDir(path string, name string) error {
	stat, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("Could not read %s directory %s: %v.\n", name, path, err.Error())
	}
	if !stat.IsDir() {
		return fmt.Errorf("%s path %s is not a directory.\n", name, path)
	}
	return nil
}

func validateFile(path string, name string) error {
	stat, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("Could not read %s directory %s: %v.\n", name, path, err.Error())
	}
	if stat.IsDir() {
		return fmt.Errorf("%s path %s is not a file.\n", name, path)
	}
	return nil
}
