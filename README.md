# Exa Docker Sandboxes Kit (v3)

Docker Sandboxes kit that packages the official [`exa-mcp-server`](https://www.npmjs.com/package/exa-mcp-server)
into the sandbox as a **v3 kit OCI artifact** — descriptor in the manifest
annotation, content in layers ([SPEC-v3](https://github.com/docker/sandbox-kit-spec)).

The kit gives sandboxed coding agents Exa web search, crawling/content
extraction, and research tools through MCP, wired into each agent's config
(Claude Code / VS Code / Gemini / Codex). The Exa API key stays in the host
secret store; the sandbox proxy injects `Authorization: Bearer …` on outbound
`api.exa.ai` requests — the key never enters the sandbox.

## Layout (v3 companion pair)

| File | Role |
|---|---|
| `exa.yaml` | Kit descriptor (`schemaVersion: "3"`, `kind: mixin`). Capabilities: `network-policy@2` (allow `api.exa.ai`), `credential@1` (proxy-managed `EXA_API_KEY`), `lifecycle@1` (agent-config wiring hooks), `agent-context@1` (usage guidance for the agent). |
| `exa.dockerfile` | Content recipe: `node:22-alpine` + pinned `exa-mcp-server` (version comes from the descriptor's `mcpServerVersion` build-arg). |
| `tools/validate-desc` | Local validator built from `docker/sandbox-kit-spec`'s own Go library (`spec.Decode` + `Validate` + `ValidateRaw` + `RequireAuthoredProvides`). |

## Quick start

```bash
# 1. one-time: store your Exa key host-side
sbx secret set -g exa          # paste the key from dashboard.exa.ai

# 2. run a sandbox with the kit (from a laptop — everything is local)
./run.sh exa-current claude .
# or point --kit at this checkout from anywhere
```

Ask the agent to search the web — it answers with Exa.

## Build & verify from source

```bash
# validate the descriptor with Docker's own spec library
./tools/validate-desc exa.yaml

# build the kit artifact (frontend dispatched by the descriptor's syntax line)
docker buildx build --build-arg EXA_MCP_SERVER_VERSION=3.4.1 \
  -f exa.yaml -t <registry>/exa-sbx-kit:2.0.0 --push .
```

The build-arg is expanded into the published descriptor at build time
(SPEC-v3 §9.1); the artifact is an ordinary OCI image — pullable, `FROM`-able,
and inspectable with stock tooling. A runtime that ignores the annotation
runs it as a plain image (degradation, never breakage).

## Local development notes

- The v1 remote-MCP variant of this kit lives in git history
  (`spec.yaml.v1.bak` is the pre-port snapshot for reference).
- `run.sh [name] [agent] [workspace]` wraps `sbx run --kit` with the local path.
