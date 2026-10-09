const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const load = Module._load;
const Provider = () => null;
Module._load = function(id, parent, main) {
  if (id === '@/lib/auth-release') return load.call(this, require('node:path').resolve(__dirname, '../.test-build/src/lib/auth-release'), parent, main);
  if (id === '@privy-io/react-auth') return { PrivyProvider: Provider };
  if (id === '@/components/LoginView') return { LoginView: () => null };
  return load.call(this, id, parent, main);
};
const Wrapper = require('../.test-build/src/providers/PrivyProviderWrapper').default;
Module._load = load;
test('Production uses SDK missing-embedded-wallet creation without migration, extra chains or additional-wallet requests', () => {
  const names = ['NEXT_PUBLIC_PRIVY_APP_ID','NEXT_PUBLIC_A3_PUBLIC_ONBOARDING','NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED'];
  const before = names.map(n => process.env[n]);
  try {
    process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'synthetic-app';
    process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED = 'false';
    for (const enabled of ['true','false']) {
      process.env.NEXT_PUBLIC_A3_PUBLIC_ONBOARDING = enabled;
      const view = Wrapper({ children: null });
      assert.equal(view.type, Provider);
      assert.equal(view.props.appId, 'synthetic-app');
      assert.deepEqual(view.props.config.loginMethods, ['email']);
      assert.deepEqual(view.props.config.embeddedWallets, {
        ethereum: { createOnLogin: enabled === 'true' ? 'all-users' : 'off' },
        solana: { createOnLogin: 'off' },
        disableAutomaticMigration: true,
      });
      assert.deepEqual(view.props.config.supportedChains.map(c => c.id), [1]);
      assert.equal('createAdditional' in view.props.config, false);
    }
    process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED = 'true';
    assert.notEqual(Wrapper({ children: null }).type, Provider);
  } finally {
    names.forEach((n,i) => { if(before[i] === undefined) delete process.env[n]; else process.env[n] = before[i]; });
  }
});
