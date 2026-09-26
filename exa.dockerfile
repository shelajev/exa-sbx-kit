# Exa MCP server + Node runtime, packaged as the kit's overlay content.
# Pinned by the descriptor's mcpServerVersion arg (buildArg EXA_MCP_SERVER_VERSION).
FROM node:22-alpine
ARG EXA_MCP_SERVER_VERSION

# -g installs into the image's global prefix (not a runtime-mutated cache),
# so the server is part of the published layer, not fetched at create time.
RUN npm install -g --no-audit --no-fund "exa-mcp-server@${EXA_MCP_SERVER_VERSION}"
