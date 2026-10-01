const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  React = require('react'),
  { renderToStaticMarkup } = require('react-dom/server'),
  Module = require('node:module'),
  path = require('node:path');
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id === '@privy-io/react-auth')
    return {
      PrivyProvider: () => {
        throw Error(
          'RC Preview must not initialize customer authentication',
        );
      },
    };
  if (id === 'next/image')
    return {
      __esModule: true,
      default: ({ unoptimized, priority, ...props }) =>
        React.createElement('img', props),
    };
  if (id.startsWith('@/'))
    return load.call(
      this,
      path.resolve(__dirname, '../.test-build/src', id.slice(2)),
      parent,
      main,
    );
  return load.call(this, id, parent, main);
};
const Wrapper =
  require('../.test-build/src/providers/PrivyProviderWrapper').default;
Module._load = load;
test('RC Preview renders disabled login without initializing Privy or the wallet workspace', () => {
  const old = process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED;
  process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED = 'true';
  try {
    const html = renderToStaticMarkup(
      React.createElement(
        Wrapper,
        null,
        React.createElement('p', {}, 'SHOULD_NOT_RENDER'),
      ),
    );
    assert.match(html, /Release candidate preview/);
    assert.equal((html.match(/disabled=""/g) || []).length, 3);
    assert.doesNotMatch(html, /SHOULD_NOT_RENDER/);
  } finally {
    if (old === undefined)
      delete process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED;
    else process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED = old;
  }
});
