# This workload intentionally has no preinstalled Node.
FROM debian:bookworm-slim
COPY --from=exa-content:check / /
COPY tests/mcp-smoke.cjs /tmp/mcp-smoke.cjs
ENTRYPOINT ["exa-node", "/tmp/mcp-smoke.cjs"]
