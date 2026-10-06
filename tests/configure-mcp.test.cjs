const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const hook = path.resolve(__dirname, '../tools/configure-mcp.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'exa-hook-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const project = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(project); fs.mkdirSync(home);
  return { project, home, run: () => spawnSync(process.execPath, [hook], {
    cwd: project, env: { ...process.env, HOME: home }, encoding: 'utf8'
  }) };
}
test('migrates local Exa to hosted MCP, preserves other servers, and remains idempotent', t => {
  const f = fixture(t);
  const file = path.join(f.project, '.mcp.json');
  fs.writeFileSync(file, JSON.stringify({ other: true, mcpServers: {
    exa: { type: 'stdio', command: 'exa-mcp-server' }, keep: { command: 'keep' }
  }}));
  assert.equal(f.run().status, 0);
  const result = JSON.parse(fs.readFileSync(file));
  assert.equal(result.other, true);
  assert.equal(result.mcpServers.keep.command, 'keep');
  assert.deepEqual(result.mcpServers.exa, { type: 'http', url: 'https://mcp.exa.ai/mcp' });
  for (const [file, section] of [
    [path.join(f.project, '.vscode/mcp.json'), 'servers'],
    [path.join(f.home, '.gemini/settings.json'), 'mcpServers']
  ]) {
    const entry = JSON.parse(fs.readFileSync(file))[section].exa;
    assert.deepEqual(entry, section === 'servers'
      ? { type: 'http', url: 'https://mcp.exa.ai/mcp' }
      : { httpUrl: 'https://mcp.exa.ai/mcp' });
  }
  const before = fs.readFileSync(file, 'utf8');
  assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('leaves malformed or non-object user configuration intact', t => {
  for (const input of ['{invalid', 'null', '[]', '{"mcpServers":null}', '{"mcpServers":[]}']) {
    const f = fixture(t);
    const file = path.join(f.project, '.mcp.json');
    fs.writeFileSync(file, input);
    const result = f.run();
    assert.equal(result.status, 0);
    assert.match(result.stderr, /skipped/);
    assert.equal(fs.readFileSync(file, 'utf8'), input);
  }
});
test('launcher resolves kit from its own directory when called elsewhere', t => {
  const f = fixture(t);
  const bin = path.join(f.home, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'sbx'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
  const result = spawnSync('bash', [path.resolve(__dirname, '../run.sh'), 'example', 'codex', f.project], {
    cwd: f.home, env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }, encoding: 'utf8'
  });
  assert.equal(result.status, 0);
  assert.deepEqual(result.stdout.trim().split('\n'), ['run', '--name', 'example', '--kit',
    path.resolve(__dirname, '..'), 'codex', f.project]);
});

test('Codex startup replaces the old endpoint and stops on a removal failure', t => {
  const descriptor = fs.readFileSync(path.resolve(__dirname, '../exa.yaml'), 'utf8');
  const command = descriptor.split('\n').find(line => line.includes('- if command -v codex'));
  assert.ok(command);
  const hook = command.trim().slice(2);
  for (const removeStatus of ['0', '1']) {
    const f = fixture(t);
    const bin = path.join(f.home, 'bin'); fs.mkdirSync(bin);
    const log = path.join(f.home, 'calls');
    fs.writeFileSync(path.join(bin, 'codex'), `#!/bin/sh
printf '%s\\n' "$*" >> "$CALLS"
case "$2" in
  get) exit 0 ;;
  remove) exit "$REMOVE_STATUS" ;;
  add) exit 0 ;;
esac
`, { mode: 0o755 });
    const result = spawnSync('sh', ['-c', hook], {
      env: { ...process.env, PATH: `${bin}:/usr/bin:/bin`, CALLS: log, REMOVE_STATUS: removeStatus },
      encoding: 'utf8'
    });
    const calls = fs.readFileSync(log, 'utf8');
    assert.match(calls, /mcp remove exa/);
    if (removeStatus === '0') {
      assert.equal(result.status, 0);
      assert.match(calls, /mcp add exa --url https:\/\/mcp\.exa\.ai\/mcp/);
    } else {
      assert.notEqual(result.status, 0);
      assert.doesNotMatch(calls, /mcp add/);
    }
  }
});

// Credentials belong to the SBX proxy, never the client JSON.
test('hosted configuration is identical with or without a key environment', t => {
  const f = fixture(t);
  for (const key of ['', 'proxy-managed', 'test-only-not-a-real-key']) {
    const result = spawnSync(process.execPath, [hook], {
      cwd: f.project, env: { ...process.env, HOME: f.home, EXA_API_KEY: key }, encoding: 'utf8'
    });
    assert.equal(result.status, 0);
    const raw = fs.readFileSync(path.join(f.project, '.mcp.json'), 'utf8');
    assert.deepEqual(JSON.parse(raw).mcpServers.exa, { type: 'http', url: 'https://mcp.exa.ai/mcp' });
    if (key) assert.ok(!raw.includes(key));
  }
});
