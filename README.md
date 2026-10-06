# Exa Docker Sandboxes Kit (v3)

Docker Sandboxes kit that wires the official [hosted Exa MCP](https://exa.ai/docs/get-started/exa-mcp)
into sandboxed agents as a **v3 kit OCI artifact** — descriptor in the manifest
annotation, content in layers ([SPEC-v3](https://github.com/docker/sandbox-kit-spec)).

The kit configures Claude Code, VS Code, Gemini, and Codex to connect to
`https://mcp.exa.ai/mcp`. Without a key, Exa provides free, rate-limited
search and page fetching. With an Exa key in the host secret store, the
sandbox proxy injects `x-api-key` for authenticated access, including research.
The real key never enters the sandbox or agent configuration.

## Layout (v3 companion pair)

| File | Role |
|---|---|
| `exa.yaml` | Kit descriptor (`schemaVersion: "3"`, `kind: mixin`). Capabilities: `network-policy@2` (allow `mcp.exa.ai`), `credential@1` (optional host-side key injection), `lifecycle@1` (agent-config wiring hooks), `agent-context@1` (usage guidance for the agent). |
| `exa.dockerfile` | Content recipe: `node:22.23.3-bookworm-slim` + pinned `exa-mcp-server` (version comes from the descriptor's `mcpServerVersion` build-arg). |
| `tools/validate-desc/` | Local validator built from `docker/sandbox-kit-spec`'s own Go library (`spec.Decode` + `Validate` + `ValidateRaw` + `RequireAuthoredProvides`). |

## Quick start

```bash
# Optional: store your Exa key host-side for authenticated access
sbx secret set -g exa          # paste the key from dashboard.exa.ai

# Run a sandbox with the kit (from a laptop — everything is local)
./run.sh exa-current claude .
# or point --kit at this checkout from anywhere
```

Ask the agent to search the web — it answers with Exa. The key is optional.

This v3 mixin requires a compatible v3 workload. SBX v0.46.0-rc5 cannot
compose its built-in v2 `claude` with it. A v3 shell workload
(`docker/sbx-kit-shell:1.0.0`) composes successfully. Use a compatible
v3 agent workload with `run.sh`; the mixin does not install Claude.

## Build & verify from source

```bash
# validate the descriptor with Docker's own spec library
go run ./tools/validate-desc exa.yaml

# build the kit artifact (frontend dispatched by the descriptor's syntax line)
docker buildx build --build-arg mcpServerVersion=3.4.1 \
  -f exa.yaml -t <registry>/exa-sbx-kit:2.0.1 --push .
```

The build-arg is expanded into the published descriptor at build time
(SPEC-v3 §9.1); the artifact is an ordinary OCI image — pullable, `FROM`-able,
and inspectable with stock tooling. A runtime that ignores the annotation
can store and inspect it as an ordinary image. This mixin needs a workload to run.

## Local development notes

- The v1 remote-MCP variant of this kit lives in git history
  (`spec.yaml.v1.bak` is the pre-port snapshot for reference).
- `run.sh [name] [agent] [workspace]` wraps `sbx run --kit` with the local path.

## Automated builds

Pushes to `main` and manual runs on `main` validate the descriptor, test
configuration migration, and build an OCI archive for `linux/amd64` and `linux/arm64`. Docker's Kit TCK checks the
archive. Download `exa-v3-kit` from the Actions run to inspect it.
With publishing credentials configured, main builds also publish to Docker Hub with `2.0.1`, `latest`, and a
commit-specific `sha-…` tag, then validates the published artifact.

```bash
sbx run --kit docker.io/olegselajev241/exa-sbx-kit:2.0.1 claude .
```

The kit carries its own Node runtime and private C++ libraries. The workload
must supply glibc 2.36 or newer (Debian 12 or newer); Alpine workloads are not
supported. Startup owns the `exa` MCP entry and migrates old local-server configurations.
Other servers and malformed JSON files are preserved.

```bash
go test ./...
go vet ./...
node --test tests/*.test.cjs
bash -n run.sh
```

Dependabot checks Go, Docker, and Actions pins monthly. Review the Exa version
in `exa.yaml` and the build frontend tag monthly against upstream releases.
Free search needs no key. Authenticated access uses an optional host Exa key; CI uses no live API credentials.

Docker Hub publishing needs the repository variable `DOCKERHUB_USERNAME` and
repository secret `DOCKERHUB_TOKEN` (a Docker Hub access token with write access).
Configure these in [GitHub Actions settings](https://github.com/shelajev/exa-sbx-kit/settings/secrets/actions)
to enable publishing. Without these settings, builds still produce the validated
OCI archive and explicitly report that registry publication was skipped.
GitHub Actions does not run on pull requests.

Hosted MCP provides `web_search_exa` and `web_fetch_exa` by default, plus
`agent_run` when authenticated. See [Exa documentation](https://exa.ai/docs/get-started/exa-mcp)
for tool selection and limits. The image retains the bundled stdio server from
2.0.0 for compatibility, but agent configuration now uses hosted HTTP MCP.
