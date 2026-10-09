process.env.NEXT_PUBLIC_A3_POST01_AUTH_ENABLED = 'true';
global.IS_REACT_ACT_ENVIRONMENT = true;
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { renderToStaticMarkup } = require('react-dom/server');
const Module = require('node:module');
const path = require('node:path');
const load = Module._load;
const calls = [];
let supported = true;
let currentUser = { id: 'synthetic-existing-user', linkedAccounts: [{ type: 'email' }] };
let authenticated = true;
let appleFailure = false;
let linkCallbacks;
Module._load = function(id, parent, main) {
  if (id === '@/hooks/useDeviceAuthentication') return { useDeviceAuthentication: () => supported };
  if (id === '@privy-io/react-auth') return {
    usePrivy: () => ({ ready: true, authenticated, user: currentUser, login: options => calls.push(['email', options]) }),
    useLoginWithOAuth: () => ({ state: { status: 'initial' }, initOAuth: async options => {
      calls.push(['apple', options]); if (appleFailure) throw Error('provider-secret-internal');
    } }),
    useLoginWithPasskey: () => ({ state: { status: 'initial' }, loginWithPasskey: async () => calls.push(['device-login']) }),
    useLinkAccount: callbacks => {
      linkCallbacks = callbacks;
      return { linkApple: () => calls.push(['link-apple', currentUser.id]), linkPasskey: options => calls.push(['link-device', currentUser.id, options]) };
    },
  };
  if (id.startsWith('@/')) return load.call(this, path.resolve(__dirname, '../.test-build/src', id.slice(2)), parent, main);
  return load.call(this, id, parent, main);
};
const Login = require('../.test-build/src/components/LoginScreen').default;
const { LoginView } = require('../.test-build/src/components/LoginView');
const { AccountSignIn, useAccountSignIn } = require('../.test-build/src/components/AccountSignIn');
Module._load = load;

test('Production email signup ignores the legacy restriction while RC and deferred OAuth remain unchanged', async () => {
  const oldRc = process.env.NEXT_PUBLIC_A3_RC_CONTINUITY;
  const oldProd = process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY;
  const oldPublic = process.env.NEXT_PUBLIC_A3_PUBLIC_ONBOARDING;
  try {
    for (const [rc, prod, publicOnboarding] of [['true','false','false'],['false','true','false'],['false','false','false'],['false','true','true']]) {
      process.env.NEXT_PUBLIC_A3_PUBLIC_ONBOARDING = publicOnboarding;
      process.env.NEXT_PUBLIC_A3_RC_CONTINUITY = rc;
      process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY = prod;
      calls.length = 0;
      let root;
      await act(async () => { root = create(React.createElement(Login)); });
      assert.equal(calls.length, 0, 'mount never initiates login or enrolment');
      const props = root.root.findByType(LoginView).props;
      await act(async () => { props.onApple(); props.onDevice(); props.onEmail(); });
      const existingOnly = rc === 'true' || prod === 'true';
      assert.deepEqual(calls, [
        ['apple', { provider: 'apple', disableSignup: existingOnly }],
        ['device-login'],
        ['email', { loginMethods: ['email'], disableSignup: publicOnboarding === 'true' ? false : existingOnly }],
      ]);
      await act(async () => root.unmount());
    }
  } finally {
    for (const [key, value] of [['NEXT_PUBLIC_A3_RC_CONTINUITY',oldRc],['NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY',oldProd],['NEXT_PUBLIC_A3_PUBLIC_ONBOARDING',oldPublic]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('unsupported devices and failed OAuth retain email fallback without leaking provider errors', async () => {
  supported = false; appleFailure = true; calls.length = 0;
  let root;
  await act(async () => { root = create(React.createElement(Login)); });
  await act(async () => {
    const props = root.root.findByType(LoginView).props;
    props.onDevice(); props.onApple();
  });
  assert.equal(calls.some(c => c[0] === 'device-login'), false);
  const props = root.root.findByType(LoginView).props;
  assert.match(props.message, /use email/);
  assert.doesNotMatch(props.message, /secret|internal/);
  const html = renderToStaticMarkup(React.createElement(LoginView, props));
  assert.match(html, /Other ways to sign in/);
  assert.match(html, /Continue with Email/);
  assert.doesNotMatch(html, /WebAuthn|credential IDs|Continue with Google/);
  await act(async () => root.unmount());
  supported = true; appleFailure = false;
});

test('enrolment links only to the authenticated existing user and does nothing on mount', async () => {
  calls.length = 0;
  function Harness() { return React.createElement(AccountSignIn, useAccountSignIn()); }
  let root;
  await act(async () => { root = create(React.createElement(Harness)); });
  assert.equal(calls.length, 0);
  await act(async () => {
    const props = root.root.findByType(AccountSignIn).props;
    props.onApple(); props.onDevice();
  });
  assert.deepEqual(calls, [
    ['link-apple','synthetic-existing-user'],
    ['link-device','synthetic-existing-user',{name:'A3 Wallet'}],
  ]);
  await act(async () => linkCallbacks.onError('secret'));
  assert.match(root.root.findByType(AccountSignIn).props.message, /will not be merged/);
  currentUser = { ...currentUser, linkedAccounts: [{type:'apple_oauth'}, {type:'passkey'}] };
  await act(async () => root.update(React.createElement(Harness)));
  calls.length = 0;
  await act(async () => {
    const props = root.root.findByType(AccountSignIn).props;
    assert.equal(props.appleLinked, true); assert.equal(props.deviceLinked, true);
    props.onApple(); props.onDevice();
  });
  assert.deepEqual(calls, [], 'already linked methods cannot enrol a duplicate');
  currentUser = { id:'synthetic-existing-user', linkedAccounts:[] }; authenticated = false;
  await act(async () => root.update(React.createElement(Harness)));
  const props = root.root.findByType(AccountSignIn).props;
  props.onApple(); props.onDevice();
  assert.deepEqual(calls, [], 'signed-out state cannot link');
  await act(async () => root.unmount());
});


test('Release 1 exposes email only and blocks deferred auth callbacks', async () => {
  delete process.env.NEXT_PUBLIC_A3_POST01_AUTH_ENABLED;
  authenticated = true; supported = true; calls.length = 0;
  let root;
  try {
    await act(async () => { root = create(React.createElement(Login)); });
    const props = root.root.findByType(LoginView).props;
    const html = renderToStaticMarkup(React.createElement(LoginView, props));
    assert.match(html, /Continue with Email/);
    assert.doesNotMatch(html, /Continue with Apple|Face ID|Touch ID|Other ways/);
    await act(async () => { props.onApple(); props.onDevice(); });
    assert.deepEqual(calls, []);
    await act(async () => props.onEmail());
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0][1].loginMethods, ['email']);
    await act(async () => root.unmount());
    calls.length = 0;
    function Harness() { return React.createElement(AccountSignIn, useAccountSignIn()); }
    await act(async () => { root = create(React.createElement(Harness)); });
    const signIn = root.root.findByType(AccountSignIn).props;
    assert.equal(root.toJSON(), null);
    await act(async () => { signIn.onApple(); signIn.onDevice(); });
    assert.deepEqual(calls, []);
  } finally {
    if (root) await act(async () => root.unmount());
    process.env.NEXT_PUBLIC_A3_POST01_AUTH_ENABLED = 'true';
  }
});
