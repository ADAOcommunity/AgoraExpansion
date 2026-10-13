const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const publisher = path.resolve(__dirname, 'publish-stable-release.sh');
const bash = process.env.RELEASE_TEST_BASH || 'bash';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agora-release-test-'));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('agora-release-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const repo = path.join(root, 'repo');
  const remote = path.join(root, 'remote.git');
  const bin = path.join(root, 'bin');
  const log = path.join(root, 'gh.log');
  fs.mkdirSync(repo);
  fs.mkdirSync(bin);
  fs.mkdirSync(path.join(repo, 'agora-expansion-fe'));
  fs.writeFileSync(path.join(repo, 'agora-expansion-fe/package.json'), '{"version":"1.0.0"}\n');
  fs.writeFileSync(path.join(repo, 'RELEASE_NOTES.md'), '# Test release\n');
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '--initial-branch=main');
  git('config', 'user.name', 'Release test');
  git('config', 'user.email', 'release-test@example.invalid');
  git('add', '.');
  git('commit', '-m', 'Initial fixture');
  git('init', '--bare', remote);
  git('remote', 'add', 'origin', remote);
  git('push', 'origin', 'HEAD:refs/heads/main');
  fs.writeFileSync(path.join(bin, 'gh'), `#!/usr/bin/env bash
set -eu
printf '%s\\n' "$*" >> "$MOCK_GH_LOG"
if [[ "$1" == 'api' ]]; then
  if [[ "\${MOCK_API_ERROR:-}" == '1' ]]; then
    echo 'Simulated API failure' >&2
    exit 1
  fi
  if [[ -n "\${MOCK_RELEASE_STATUS:-}" ]]; then
    printf '%s\\n' "$MOCK_RELEASE_STATUS"
  fi
elif [[ "$1" == 'release' && "$2" == 'create' ]]; then
  if [[ "\${MOCK_CREATE_ERROR:-}" == '1' ]]; then
    echo 'Simulated release creation failure' >&2
    exit 1
  fi
else
  echo 'Unexpected gh command' >&2
  exit 1
fi
`, { mode: 0o755 });
  function run(overrides = {}) {
    const command = process.platform === 'win32'
      ? 'export PATH="$(cygpath -u "$MOCK_BIN"):$PATH"; bash "$PUBLISH_SCRIPT"'
      : 'export PATH="$MOCK_BIN:$PATH"; bash "$PUBLISH_SCRIPT"';
    return spawnSync(bash, ['-c', command], {
      cwd: repo,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_REPOSITORY: 'ADAOcommunity/AgoraExpansion',
        GITHUB_REF: 'refs/heads/main',
        GITHUB_SHA: git('rev-parse', 'HEAD'),
        GITHUB_ACTOR: 'bayareaeagle',
        MOCK_BIN: bin,
        MOCK_GH_LOG: log,
        MOCK_API_ERROR: '',
        MOCK_CREATE_ERROR: '',
        MOCK_RELEASE_STATUS: '',
        PUBLISH_SCRIPT: publisher.split(path.sep).join('/'),
        ...overrides,
      },
    });
  }
  const tagRefs = () => git('ls-remote', '--tags', 'origin', 'refs/tags/v1.0.0', 'refs/tags/v1.0.0^{}');
  const commands = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
  return { repo, git, run, tagRefs, commands };
}

test('publishes an annotated tag on the triggering commit and uses the release notes', (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.git('cat-file', '-t', 'refs/tags/v1.0.0'), 'tag');
  assert.equal(f.git('rev-parse', 'v1.0.0^{commit}'), f.git('rev-parse', 'HEAD'));
  assert.match(f.tagRefs(), /refs\/tags\/v1\.0\.0\^\{\}/);
  assert.match(f.commands(), /release create v1\.0\.0 .*--verify-tag .*--notes-file RELEASE_NOTES\.md --latest/);
});

test('leaves an already published release and tag unchanged', (t) => {
  const f = fixture(t);
  assert.equal(f.run().status, 0);
  const originalTag = f.tagRefs();
  const countBefore = f.commands().match(/release create/g).length;
  const result = f.run({ MOCK_RELEASE_STATUS: 'published' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.tagRefs(), originalTag);
  assert.equal(f.commands().match(/release create/g).length, countBefore);
});

for (const [name, overrides] of [
  ['fork', { GITHUB_REPOSITORY: 'bayareaeagle/AgoraExpansion' }],
  ['non-main branch', { GITHUB_REF: 'refs/heads/release/test' }],
  ['wrong checkout', { GITHUB_SHA: '0'.repeat(40) }],
  ['API failure', { MOCK_API_ERROR: '1' }],
  ['draft release', { MOCK_RELEASE_STATUS: 'draft' }],
  ['prerelease', { MOCK_RELEASE_STATUS: 'prerelease' }],
  ['published release with missing tag', { MOCK_RELEASE_STATUS: 'published' }],
]) {
  test(`refuses publication for ${name}`, (t) => {
    const f = fixture(t);
    assert.notEqual(f.run(overrides).status, 0);
    assert.equal(f.tagRefs(), '');
    assert.doesNotMatch(f.commands(), /release create/);
  });
}

test('refuses a package version that does not match v1.0.0', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.repo, 'agora-expansion-fe/package.json'), '{"version":"0.1.0"}\n');
  f.git('add', '.');
  f.git('commit', '-m', 'Mismatched version');
  assert.notEqual(f.run().status, 0);
  assert.equal(f.tagRefs(), '');
});

test('refuses to move an existing tag to a different commit', (t) => {
  const f = fixture(t);
  f.git('tag', '-a', 'v1.0.0', '-m', 'Existing release');
  f.git('push', 'origin', 'refs/tags/v1.0.0');
  const originalTag = f.tagRefs();
  fs.writeFileSync(path.join(f.repo, 'README.md'), 'A later commit\n');
  f.git('add', '.');
  f.git('commit', '-m', 'Later commit');
  assert.notEqual(f.run().status, 0);
  assert.equal(f.tagRefs(), originalTag);
  assert.doesNotMatch(f.commands(), /release create/);
});

test('recovers after a tag push succeeds but release creation fails', (t) => {
  const f = fixture(t);
  assert.notEqual(f.run({ MOCK_CREATE_ERROR: '1' }).status, 0);
  const originalTag = f.tagRefs();
  assert.notEqual(originalTag, '');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.tagRefs(), originalTag);
});
