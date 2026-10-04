const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
function config(overrides) {
  return JSON.parse(execFileSync(process.execPath, ['-e',
    '(async()=>{const c=require("./next.config.js");console.log(JSON.stringify({env:c.env,headers:await c.headers()}))})()'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'release/a3-rc2',
      A3_RC_CONTINUITY_ENABLED: 'true', NEXT_PUBLIC_PRIVY_APP_ID: 'cmlkt2n7x00wp0cl6diua9vtf', ...overrides },
    encoding: 'utf8',
  }));
}
test('RC2 unlock requires Preview, exact branch, explicit opt-in and original App ID', () => {
  const enabled = config({});
  assert.equal(enabled.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED, 'false');
  assert.equal(enabled.env.NEXT_PUBLIC_A3_RC_CONTINUITY, 'true');
  const csp = enabled.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /frame-src https:\/\/\*\.privy\.io/);
  assert.match(csp, /frame-ancestors 'none'/);
  for (const overrides of [
    { VERCEL_GIT_COMMIT_REF: 'release/a3-rc1' },
    { A3_RC_CONTINUITY_ENABLED: '' },
    { NEXT_PUBLIC_PRIVY_APP_ID: 'different-app' },
  ]) {
    const locked = config(overrides);
    assert.equal(locked.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED, 'true');
    assert.equal(locked.env.NEXT_PUBLIC_A3_RC_CONTINUITY, 'false');
    assert.doesNotMatch(locked.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value, /privy/);
  }
  const production = config({ VERCEL_ENV: 'production' });
  assert.equal(production.env.NEXT_PUBLIC_A3_RC_CONTINUITY, 'false');
  assert.equal(production.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED, 'false');
  assert.equal(config({ VERCEL_ENV: 'production', A3_CONTROLLED_RELEASE: 'true' }).env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY, 'true');
  assert.equal(config({ VERCEL_ENV: 'production', A3_CONTROLLED_RELEASE: 'false' }).env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY, 'false');
});

