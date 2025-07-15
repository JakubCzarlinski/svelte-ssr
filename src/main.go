package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path"
	"svelte-ssr/src/render"
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
}

func execute() error {
	// Check if the directories are valid.
	if err := validateDir(callFromPath, "call from"); err != nil {
		return fmt.Errorf("Could not validate call from path: %v", err)
	}
	if err := os.Chdir(callFromPath); err != nil {
		return fmt.Errorf("Could not change directory to %s: %v", callFromPath, err)
	}
	if err := validateDir(componentPath, "input"); err != nil {
		return fmt.Errorf("Could not validate component path: %v", err)
	}
	if err := validateFile(tailwindConfig, "tailwind config"); err != nil {
		return fmt.Errorf("Could not validate tailwind config path: %v", err)
	}

	if clean {
		if err := os.RemoveAll(compilePath); err != nil {
			return fmt.Errorf("Could not clean compile path %s: %v", compilePath, err)
		}
	}
	if err := os.MkdirAll(compilePath, 0755); err != nil {
		return fmt.Errorf("Could not create compile path %s: %v", compilePath, err)
	}

	// Create a .temp directory in the compile path.
	tempDir := path.Join(compilePath, ".cache")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("Could not create temporary directory %s: %v", tempDir, err)
	}

	config := &render.RenderConfig{
		ComponentPath:  componentPath,
		CompilePath:    compilePath,
		TailwindConfig: tailwindConfig,
		CallFromPath:   callFromPath,
		Clean:          clean,
	}

	// Save the config to a file for debugging purposes.
	b, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("Could not marshal config: %v", err)
	}
	if err := os.WriteFile(path.Join(tempDir, "config.json"), b, 0644); err != nil {
		return fmt.Errorf("Could not write config file: %v", err)
	}

	if err := render.Render(config); err != nil {
		return fmt.Errorf("Rendering failed: %v", err)
	}
	return nil
}

func main() {
	if err := execute(); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	os.Exit(0)
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
