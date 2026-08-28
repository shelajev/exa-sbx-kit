# Exa Docker Sandboxes Kit

Docker Sandboxes kit that gives sandboxed coding agents [Exa](https://exa.ai) web search, advanced search, and page fetching through MCP. The Exa API key remains in the host secret store and is injected into requests by the Docker Sandboxes proxy; it is never placed in the sandbox.

## Quick start

1. Create an API key in the [Exa dashboard](https://dashboard.exa.ai/api-keys).

2. Store it as a sandbox secret on the host:

   ```bash
   sbx secret set -g exa
   # paste the Exa API key when prompted
   ```

3. Run a sandbox with the kit attached. Replace `.` with the workspace path you want:

   ```bash
   sbx run --kit git+https://github.com/shelajev/exa-sbx-kit.git claude .
   ```

Inside the sandbox, ask the agent to search the web with Exa or fetch a page.

## Named sandbox

For a persistent sandbox you can re-attach to:

```bash
sbx create --name exa-current \
  --kit git+https://github.com/shelajev/exa-sbx-kit.git claude .

sbx run exa-current
```

For custom kits, pass `--kit` again when re-running an existing sandbox if `sbx` does not resolve it automatically.

## How it works

The kit declares an `exa` credential service in `spec.yaml`. The Docker Sandboxes proxy reads the host-stored `exa` secret and injects `Authorization: Bearer <key>` only into requests to `mcp.exa.ai`. The key is not copied into an environment variable or configuration file in the sandbox.

At startup, the kit idempotently adds Exa's hosted MCP endpoint to:

- Codex's MCP configuration
- the standard project `.mcp.json` used by Claude Code and other compatible agents
- `.vscode/mcp.json`
- Gemini CLI's user settings

The endpoint enables `web_search_exa`, `web_search_advanced_exa`, and `web_fetch_exa`.

## Network policy

The kit allows only `mcp.exa.ai`. Exa performs searches and page retrieval remotely, so target websites do not need to be added to the sandbox's network allowlist.

## Local clone

If you clone this repository, `run.sh` runs a named sandbox using the local kit path:

```bash
./run.sh exa-current
```

Use any sandbox name as the first argument:

```bash
./run.sh my-sandbox
```

## License

MIT. See [LICENSE](LICENSE).
