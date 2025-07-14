package render

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"strings"

	"github.com/JakubCzarlinski/go-pooling"
	"golang.org/x/sync/errgroup"
)

var permittedExtensions [7]string = [7]string{
	".svelte",
	".js",
	".cjs",
	".mjs",
	".css",
	".html",
	".json",
}

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

var bytesBufferPool = CreateBytesBufferPool(1024)

type BytesBuffer struct {
	b []byte
}

func (b BytesBuffer) Reset(struct{}) {
	b.b = b.b[:0] // Reset the buffer without allocating a new one.
}

func CreateBytesBufferPool(size int) *pooling.Pool[*BytesBuffer, struct{}] {
	return pooling.NewPool(func() *BytesBuffer {
		return &BytesBuffer{b: make([]byte, size)}
	})
}

func Render(config *RenderConfig) error {
	fmt.Printf("Rendering with config: %s\n", config.String())

	// Read the files and directories in the component path recursively.
	svelteFiles := []string{}
	errGroup := &errgroup.Group{}

	walkFn := func(p string, entry os.DirEntry, err error) error {
		if err != nil {
			return fmt.Errorf("Error reading directory %s: %v", p, err)
		}
		if entry.IsDir() {
			// Skip the root directory.
			if p == "." {
				return nil
			}

			// Make the directory in the compile path.
			destDir := path.Join(config.CompilePath, p)
			if err := os.MkdirAll(destDir, 0755); err != nil {
				return fmt.Errorf("Could not create directory %s: %v", destDir, err)
			}
		}

		for _, ext := range permittedExtensions {
			if !strings.HasSuffix(entry.Name(), ext) {
				continue

			} else if ext == ".svelte" {
				svelteFiles = append(svelteFiles, p)
				return nil

			} else {
				errGroup.Go(func() error {
					return copyFile(config, p)
				})
			}
		}
		return nil
	}

	if err := fs.WalkDir(os.DirFS(config.ComponentPath), ".", walkFn); err != nil {
		return fmt.Errorf("Error walking directory: %w", err)
	}

	if err := errGroup.Wait(); err != nil {
		return fmt.Errorf("Error during file copy: %w", err)
	}

	if len(svelteFiles) == 0 {
		return fmt.Errorf("No .svelte files found in the component path %s", config.ComponentPath)
	}
	fmt.Printf("Found %d .svelte files in the component path.\n", len(svelteFiles))

	for _, file := range svelteFiles {
		fmt.Printf("Processing .svelte file: %s\n", file)
	}

	return nil
}

func copyFile(config *RenderConfig, filename string) error {

	srcPath := path.Join(config.ComponentPath, filename)
	destPath := path.Join(config.CompilePath, filename)

	if !config.Clean {
		srcInfo, err := os.Stat(srcPath)
		if err != nil {
			if os.IsNotExist(err) {
				return fmt.Errorf("Source file %s does not exist: %v", srcPath, err)
			}
			return fmt.Errorf("Could not get info for source file %s: %v", srcPath, err)
		}

		// Get destination file info
		destInfo, err := os.Stat(destPath)
		if err != nil && !os.IsNotExist(err) {
			// Errored but we not because the file does not exist.
			return fmt.Errorf("Could not get info for destination file %s: %v", destPath, err)

		} else if err == nil && !destInfo.ModTime().Before(srcInfo.ModTime()) {
			// No copy needed.
			return nil
		}
	}

	// File does not exist or is older, proceed with copying.
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("Could not open file %s: %v", srcPath, err)
	}
	defer srcFile.Close()

	destFile, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("Could not create file %s: %v", destPath, err)
	}
	defer destFile.Close()

	buffer := bytesBufferPool.Get()
	defer bytesBufferPool.Reset(buffer, struct{}{})
	if _, err = io.CopyBuffer(destFile, srcFile, buffer.b); err != nil {
		return fmt.Errorf("Could not copy file from %s to %s: %v", srcPath, destPath, err)
	}
	return nil
}
