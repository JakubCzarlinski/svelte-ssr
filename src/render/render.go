package render

import "fmt"

type RenderConfig struct {
	ComponentPath  string
	CompilePath    string
	TailwindConfig string
	CallFromPath   string
	Clean          bool
}

func (rc *RenderConfig) String() string {
	return fmt.Sprintf(
		"RenderConfig{ComponentPath: %s, CompilePath: %s, TailwindConfig: %s, CallFromPath: %s, Clean: %t}",
		rc.ComponentPath,
		rc.CompilePath,
		rc.TailwindConfig,
		rc.CallFromPath,
		rc.Clean,
	)
}

func Render(config *RenderConfig) {

	// println(config.String())
}
