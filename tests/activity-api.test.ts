import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GET } from '../src/app/api/transactions/route';
const request = () =>
  new Request(
    'https://wallet.invalid/api/transactions?address=0x1111111111111111111111111111111111111111',
  );
test('Etherscan V2 missing key, provider failure and malformed responses are unavailable, only genuine empty is success', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.ETHERSCAN_API_KEY;
  try {
    delete process.env.ETHERSCAN_API_KEY;
    assert.equal((await GET(request())).status, 503);
    process.env.ETHERSCAN_API_KEY = 'synthetic-test-key';
    for (const data of [
      { status: '0', message: 'NOTOK', result: 'rate limited' },
      { status: '1', result: [{}] },
      null,
    ]) {
      global.fetch = async (url) => {
        const parsed = new URL(String(url));
        assert.equal(parsed.pathname, '/v2/api');
        assert.equal(parsed.searchParams.get('chainid'), '1');
        return Response.json(data);
      };
      const response = await GET(request());
      assert.equal(response.status, 502);
      assert.doesNotMatch(await response.text(), /synthetic-test-key/);
    }
    global.fetch = async () =>
      Response.json({
        status: '0',
        message: 'No transactions found',
        result: [],
      });
    const empty = await GET(request());
    assert.equal(empty.status, 200);
    assert.deepEqual((await empty.json()).transactions, []);
    assert.equal(
      (
        await GET(
          new Request('https://wallet.invalid/api/transactions?address=no'),
        )
      ).status,
      400,
    );
    const row = {
      hash: '0x' + 'a'.repeat(64),
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      timeStamp: '1700000000',
      value: '100',
      input: '0x',
      isError: '0',
      confirmations: '1',
    };
    global.fetch = async () => Response.json({ status: '1', result: [row] });
    const result = (await (await GET(request())).json()).transactions[0];
    assert.equal(result.direction, 'outgoing');
    assert.equal(result.asset, 'ETH');
    assert.equal(result.status, 'confirmed');
    assert.equal(result.amount, '100');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.ETHERSCAN_API_KEY;
    else process.env.ETHERSCAN_API_KEY = originalKey;
  }
});
