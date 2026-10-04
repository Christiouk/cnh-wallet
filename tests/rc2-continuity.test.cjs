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

test('all RC2 login buttons disable signup and never use the unrestricted OAuth flow', () => {
  const Module = require('node:module');
  const load = Module._load;
  const calls = [];
  Module._load = function(id, parent, main) {
    if (id === './LoginView') return { LoginView: () => null };
    if (id === '@privy-io/react-auth') return {
      usePrivy: () => ({ login: options => calls.push(options) }),
      useLoginWithOAuth: () => ({ initOAuth: () => { throw Error('Unrestricted OAuth'); } }),
    };
    return load.call(this, id, parent, main);
  };
  const Login = require('../.test-build/src/components/LoginScreen').default;
  Module._load = load;
  const old = process.env.NEXT_PUBLIC_A3_RC_CONTINUITY;
  const oldProduction = process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY;
  process.env.NEXT_PUBLIC_A3_RC_CONTINUITY = 'true';
  try {
    const view = Login();
    view.props.onEmail(); view.props.onApple(); view.props.onGoogle();
    assert.deepEqual(calls, ['email','apple','google'].map(method => ({ loginMethods: [method], disableSignup: true })));
    calls.length = 0;
    process.env.NEXT_PUBLIC_A3_RC_CONTINUITY = 'false';
    process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY = 'true';
    const productionView = Login();
    productionView.props.onEmail(); productionView.props.onApple(); productionView.props.onGoogle();
    assert.deepEqual(calls, ['email','apple','google'].map(method => ({ loginMethods: [method], disableSignup: true })));
  } finally {
    if (old === undefined) delete process.env.NEXT_PUBLIC_A3_RC_CONTINUITY;
    else process.env.NEXT_PUBLIC_A3_RC_CONTINUITY = old;
    if (oldProduction === undefined) delete process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY;
    else process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY = oldProduction;
  }
});
