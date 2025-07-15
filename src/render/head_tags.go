package render

import (
	"time"

	regexp "github.com/wasilibs/go-re2"
)

const svelteHeadTag = "<svelte:head>"
const svelteHeadCloseTag = "</svelte:head>"
const svelteHeadLen = len(svelteHeadTag)

var svelteHeadTagRegex *regexp.Regexp = regexp.MustCompile(
	svelteHeadTag + `(.*?)` + svelteHeadCloseTag,
)

func AddLinkTag(source string, href string) (string, error) {
	linkTag := `<link rel="modulepreload" as="script" href="/assets/` + href + `">`

	// Use the regex to find the <svelte:head> section
	match := svelteHeadTagRegex.FindStringIndex(source)
	if match != nil {
		start := match[0] + svelteHeadLen
		source = source[:start] + linkTag + source[start:]
		return source, nil
	}

	return source + svelteHeadTag + linkTag + svelteHeadCloseTag, nil
}

func Test_AddLinkTag() {
	// Example usage
	source := `<html><body>Hello World</body></html>`
	href := "styles.css"

	starttime := time.Now()
	result, err := AddLinkTag(source, href)
	timeTaken := time.Since(starttime)
	if err != nil {
		panic(err)
	}

	// Output the result
	println(result, "\nTime taken:", timeTaken.String())

	sourceWithHead := `<html><body>Hello World<svelte:head><a></a></svelte:head></body></html>`
	starttime = time.Now()
	resultWithHead, err := AddLinkTag(sourceWithHead, href)
	timeTaken = time.Since(starttime)
	if err != nil {
		panic(err)
	}
	// Output the result with existing <svelte:head>
	println(resultWithHead, "\nTime taken:", timeTaken.String())
}
