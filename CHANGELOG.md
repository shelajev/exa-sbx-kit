# Changelog

## 2.0.1

- Use hosted Exa MCP for free keyless search and authenticated access.
- Inject an optional host API key on mcp.exa.ai without storing keys in agent configs.
- Migrate Claude, VS Code, Gemini, and Codex to HTTP MCP.

## 2.0.0

- Port the kit to v3 OCI packaging with an explicit Node runtime overlay.
- Authenticate the packaged MCP server through proxy-managed `x-api-key` injection.
- Migrate existing Exa agent configurations and preserve other MCP servers.
- Build and validate both CPU platforms on main in GitHub Actions; publish main builds to Docker Hub.
- Replace the Linux-only validator binary with portable Go source.
