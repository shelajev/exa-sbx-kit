# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e
# Review the Node pin monthly alongside the Exa version in exa.yaml.
FROM node:26.9.0-bookworm-slim AS build
ARG EXA_MCP_SERVER_VERSION
RUN npm install -g --prefix /opt/exa-server --no-audit --no-fund "exa-mcp-server@${EXA_MCP_SERVER_VERSION}" \
 && mkdir -p /opt/exa/lib \
 && cp /usr/lib/*/libstdc++.so.6 /opt/exa/lib/ \
 && cp /lib/*/libgcc_s.so.1 /opt/exa/lib/

# A mixin publishes only its overlay. Carry Node explicitly, without the distro.
# The workload supplies glibc >= 2.36; libstdc++ and libgcc stay private to Node.
FROM scratch
COPY --from=build /usr/local/bin/node /opt/exa/bin/node
COPY --from=build /opt/exa/lib /opt/exa/lib
COPY --from=build /opt/exa-server /opt/exa-server
COPY tools/configure-mcp.cjs /usr/local/libexec/exa-configure-mcp.cjs
COPY --chmod=755 <<'EOF' /usr/local/bin/exa-mcp-server
#!/bin/sh
export LD_LIBRARY_PATH="/opt/exa/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export ENABLED_TOOLS="${ENABLED_TOOLS-${TOOLS-web_search_exa,web_search_advanced_exa,web_fetch_exa,agent_run}}"
exec /opt/exa/bin/node /opt/exa-server/lib/node_modules/exa-mcp-server/dist/stdio.cjs "$@"
EOF
COPY --chmod=755 <<'EOF' /usr/local/bin/exa-node
#!/bin/sh
export LD_LIBRARY_PATH="/opt/exa/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec /opt/exa/bin/node "$@"
EOF
