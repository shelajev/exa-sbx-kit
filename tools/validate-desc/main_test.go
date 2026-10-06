package main

import (
	"os"
	"strings"
	"testing"
)

func TestDescriptor(t *testing.T) {
	raw, err := os.ReadFile("../../exa.yaml")
	if err != nil {
		t.Fatal(err)
	}
	if err := validate(raw); err != nil {
		t.Fatal(err)
	}
	invalid := strings.Replace(string(raw), "schemaVersion: \"3\"", "schemaVersion: \"1\"", 1)
	if err := validate([]byte(invalid)); err == nil {
		t.Fatal("accepted v1 descriptor")
	}
}
