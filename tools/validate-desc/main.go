package main

import (
	"fmt"
	"github.com/docker/sandbox-kit-spec/v3/spec"
	"os"
)

func validate(raw []byte) error {
	d, err := spec.Decode(raw)
	if err != nil {
		return err
	}
	if _, err = spec.Validate(d); err != nil {
		return err
	}
	if _, err = spec.ValidateRaw(raw, d); err != nil {
		return err
	}
	return spec.RequireAuthoredProvides(d)
}
func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: go run ./tools/validate-desc exa.yaml")
		os.Exit(2)
	}
	raw, err := os.ReadFile(os.Args[1])
	if err == nil {
		err = validate(raw)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println("Descriptor valid")
}
