const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

// Check stdio protocol and tool discovery without calling the paid Exa API.
function smoke() {
  const child = spawn('exa-mcp-server', [], { stdio: ['pipe', 'pipe', 'inherit'] });
  let buffer = '';
  let discovered = false;
  const timer = setTimeout(() => {
    console.error('MCP server did not respond; check the packaged Node runtime.');
    child.kill(); process.exitCode = 1;
  }, 15000);
  child.on('error', error => { clearTimeout(timer); throw error; });
  child.on('exit', code => {
    clearTimeout(timer);
    if (!discovered || (code !== 0 && code !== null)) process.exitCode = 1;
  });
  const send = message => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);
  child.stdout.on('data', data => {
    buffer += data;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const message = JSON.parse(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      if (message.id === 1) {
        assert.equal(message.result.serverInfo.version, '3.4.1');
        send({ method: 'notifications/initialized' });
        send({ id: 2, method: 'tools/list', params: {} });
      } else if (message.id === 2) {
        const expected = (process.env.SMOKE_EXPECTED_TOOLS ||
          'web_search_exa,web_search_advanced_exa,web_fetch_exa,agent_run').split(',').sort();
        assert.deepEqual(message.result.tools.map(tool => tool.name).sort(), expected);
        discovered = true;
        console.log('Packaged Node starts the MCP server and exposes Exa search.');
        clearTimeout(timer); child.stdin.end();
      }
    }
  });
  send({ id: 1, method: 'initialize', params: {
    protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'kit-smoke', version: '1.0.0' }
  }});
}
if (require.main === module) smoke();
module.exports = { smoke };
