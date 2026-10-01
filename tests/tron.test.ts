import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertContinuity,
  displayUnits,
  identity,
  parseUsdt,
  selectTron,
  TRON_USDT,
  tronHex,
  validTronAddress,
  validateTransaction,
  type UserSnapshot,
} from '../src/lib/tron/core';
import { enableTron, type CreationPort } from '../src/lib/tron/creation';
import {
  confirmSend,
  prepareSend,
  readActivity,
  readBalances,
  ResourceRequired,
  type TronTransport,
} from '../src/lib/tron/provider';
import {
  OWNER,
  RECIPIENT,
  fixtureIntent,
  fixtureTransaction,
  uint,
} from './fixtures/tron';
import type { LinkedWallet } from '../src/lib/wallet/selection';
const account = (
  chainType: LinkedWallet['chainType'] = 'ethereum',
  address = '0x1111111111111111111111111111111111111111',
): LinkedWallet => ({
  type: 'wallet',
  id: chainType === 'tron' ? OWNER.walletId : 'existing-evm',
  address,
  chainType,
  walletClientType: 'privy',
  connectorType: 'embedded',
  imported: false,
  delegated: false,
  walletIndex: null,
  firstVerifiedAt: null,
  latestVerifiedAt: null,
});
const evm = account(),
  tron = account('tron', OWNER.address);
const user = (linkedAccounts = [evm]): UserSnapshot => ({
  id: OWNER.did,
  linkedAccounts,
});
const transport: TronTransport = async (operation, args) => {
  switch (operation) {
    case 'account':
      return {
        success: true,
        data: [{ address: tronHex(OWNER.address), balance: 200_000_000 }],
      };
    case 'balance':
      return uint(100_000_000);
    case 'decimals':
      return uint(6);
    case 'parameters':
      return {
        chainParameter: [
          { key: 'getEnergyFee', value: 100 },
          { key: 'getTransactionFee', value: 1000 },
        ],
      };
    case 'resources':
      return { EnergyLimit: 0, EnergyUsed: 0 };
    case 'simulate':
      return {
        ...uint(1),
        energy_used: 100_000,
        transaction: { ret: [{ ret: 'SUCCESS' }] },
      };
    case 'build':
      return {
        result: { result: true },
        transaction: fixtureTransaction(
          String(args.owner),
          String(args.recipient),
          String(args.units),
          Number(args.feeLimit),
        ),
      };
    default:
      throw new Error('unsupported test operation');
  }
};
test('Tron selector excludes external wallets, rejects duplicates, invalid addresses and missing wallet ID', () => {
  assert.equal(selectTron(user()).status, 'missing');
  assert.equal(selectTron(user([evm, tron])).status, 'ready');
  assert.deepEqual(identity(user([evm, tron])), OWNER);
  assert.equal(
    selectTron(
      user([
        evm,
        { ...tron, walletClientType: 'metamask', connectorType: 'injected' },
      ]),
    ).status,
    'missing',
  );
  assert.equal(
    selectTron(user([tron, { ...tron, id: 'other' }])).status,
    'ambiguous',
  );
  assert.equal(
    selectTron(user([{ ...tron, address: evm.address }])).status,
    'unavailable',
  );
  assert.equal(
    selectTron(user([{ ...tron, id: undefined }])).status,
    'unavailable',
  );
  assert.equal(selectTron(user(), false).status, 'loading');
  assert.equal(selectTron(null, true, false).status, 'unauthenticated');
});
test('Tron address Base58Check and decimals reject EVM, checksum changes, exponent, negative and rounding', () => {
  assert.equal(validTronAddress(OWNER.address), true);
  for (const address of [
    evm.address,
    '',
    OWNER.address.slice(0, -1) + '9',
    tronHex(OWNER.address),
  ])
    assert.equal(validTronAddress(address), false);
  assert.equal(parseUsdt('1.250001'), 1_250_001n);
  assert.equal(displayUnits('1250001'), '1.250001');
  for (const amount of [
    '',
    '0',
    '-1',
    '1e6',
    '1.0000001',
    '01',
    'NaN',
    ' 1',
    '9'.repeat(90),
  ])
    assert.throws(() => parseUsdt(amount));
});
test('intentional creation preserves DID and all existing EVM wallets; repeated requests rediscover without creation', async () => {
  let current = user(),
    calls = 0,
    attempted = false;
  let tail = Promise.resolve();
  const port: CreationPort = {
    current: async () => current,
    create: async () => {
      calls++;
      current = user([evm, tron]);
      return current;
    },
    attempted: () => attempted,
    markAttempt: () => {
      attempted = true;
    },
    lock: async (_id, action) => {
      const before = tail;
      let release!: () => void;
      tail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await before;
      try {
        return await action();
      } finally {
        release();
      }
    },
  };
  await assert.rejects(enableTron(port, OWNER.did, false));
  assert.equal(calls, 0);
  const original = structuredClone(current);
  await Promise.all([
    enableTron(port, OWNER.did, true),
    enableTron(port, OWNER.did, true),
  ]);
  assert.equal(calls, 1);
  assertContinuity(original, current);
  assert.deepEqual(current.linkedAccounts[0], evm);
  await enableTron(port, OWNER.did, true);
  assert.equal(calls, 1);
});
test('uncertain creation is never blindly retried; changed identity and EVM mappings fail closed', async () => {
  let calls = 0,
    attempted = false;
  const port: CreationPort = {
    current: async () => user(),
    create: async () => {
      calls++;
      throw new Error('timeout');
    },
    attempted: () => attempted,
    markAttempt: () => {
      attempted = true;
    },
    lock: async (_id, action) => action(),
  };
  await assert.rejects(enableTron(port, OWNER.did, true), /timeout/);
  await assert.rejects(enableTron(port, OWNER.did, true), /already made/);
  assert.equal(calls, 1);
  assert.throws(() =>
    assertContinuity(user(), { ...user([evm, tron]), id: 'different' }),
  );
  assert.throws(() =>
    assertContinuity(
      user(),
      user([
        { ...evm, address: '0x2222222222222222222222222222222222222222' },
        tron,
      ]),
    ),
  );
});
test('balance zero is verified; timeout, bad decimals, malformed upstream and partial failure are unavailable', async () => {
  const zero: TronTransport = async (op, args) =>
    op === 'account'
      ? { success: true, data: [] }
      : op === 'balance'
        ? uint(0)
        : transport(op, args);
  assert.deepEqual(await readBalances(zero, OWNER.address), {
    trx: { status: 'ready', units: '0' },
    usdt: { status: 'ready', units: '0' },
    activated: false,
  });
  for (const operation of ['account', 'balance', 'decimals']) {
    const result = await readBalances(async (op, args) => {
      if (op === operation) throw new DOMException('timed out', 'TimeoutError');
      return transport(op, args);
    }, OWNER.address);
    assert.equal(
      operation === 'account' ? result.trx.status : result.usdt.status,
      'unavailable',
    );
    assert.equal(
      operation === 'account' ? result.usdt.status : result.trx.status,
      'ready',
    );
  }
  for (const bad of [
    null,
    {},
    { success: true, data: [{}] },
    { success: true, data: [{ address: tronHex(OWNER.address), balance: -1 }] },
  ])
    assert.equal(
      (
        await readBalances(
          async (op, args) => (op === 'account' ? bad : transport(op, args)),
          OWNER.address,
        )
      ).trx.status,
      'unavailable',
    );
  assert.equal(
    (
      await readBalances(
        async (op, args) =>
          op === 'decimals' ? uint(18) : transport(op, args),
        OWNER.address,
      )
    ).usdt.status,
    'unavailable',
  );
});
test('preflight builds exact canonical full-amount USDT transfer with zero A3 fee', async () => {
  const quote = await prepareSend(transport, OWNER, RECIPIENT, '1.250001');
  assert.equal(quote.intent.units, '1250001');
  assert.equal(quote.applicationFee, '0');
  assert.equal(
    quote.intent.transaction.raw_data.contract[0].parameter.value
      .contract_address,
    tronHex(TRON_USDT.contract),
  );
  validateTransaction(quote.intent, OWNER);
});
test('preflight blocks insufficient USDT, inactive/empty TRX, failed simulation and missing fee data', async () => {
  await assert.rejects(
    prepareSend(
      async (op, args) => (op === 'balance' ? uint(0) : transport(op, args)),
      OWNER,
      RECIPIENT,
      '1',
    ),
    /Insufficient USDT/,
  );
  for (const data of [[], [{ address: tronHex(OWNER.address), balance: 0 }]])
    await assert.rejects(
      prepareSend(
        async (op, args) =>
          op === 'account' ? { success: true, data } : transport(op, args),
        OWNER,
        RECIPIENT,
        '1',
      ),
      ResourceRequired,
    );
  for (const operation of ['simulate', 'parameters', 'resources'])
    await assert.rejects(
      prepareSend(
        async (op, args) => (op === operation ? null : transport(op, args)),
        OWNER,
        RECIPIENT,
        '1',
      ),
    );
});
test('signing payload rejects wrong owner, contract, recipient, amount, extra calls/permissions/value, bytes, hash and expiry', () => {
  const good = fixtureIntent();
  validateTransaction(good, OWNER);
  const changes = [
    (i: typeof good) => {
      i.did = 'other';
    },
    (i: typeof good) => {
      i.network = 'ethereum' as typeof i.network;
    },
    (i: typeof good) => {
      i.transaction.raw_data.contract[0].parameter.value.owner_address =
        tronHex(RECIPIENT);
    },
    (i: typeof good) => {
      i.transaction.raw_data.contract[0].parameter.value.contract_address =
        tronHex(RECIPIENT);
    },
    (i: typeof good) => {
      i.transaction.raw_data.contract[0].parameter.value.call_value = 1;
    },
    (i: typeof good) => {
      i.transaction.raw_data.contract.push(i.transaction.raw_data.contract[0]);
    },
    (i: typeof good) => {
      Object.assign(i.transaction.raw_data.contract[0], { Permission_id: 2 });
    },
    (i: typeof good) => {
      i.units = '1250001';
    },
    (i: typeof good) => {
      i.recipient = OWNER.address;
    },
    (i: typeof good) => {
      i.transaction.txID = '0'.repeat(64);
    },
    (i: typeof good) => {
      i.transaction.raw_data_hex += '00';
    },
    (i: typeof good) => {
      i.transaction.raw_data.expiration = 0;
    },
    (i: typeof good) => {
      i.feeLimit = 101_000_000;
    },
  ];
  for (const change of changes) {
    const modified = structuredClone(good);
    change(modified);
    assert.throws(() => validateTransaction(modified, OWNER));
  }
});
test('confirmation needs solidified successful receipt AND exact transfer event; hash alone is pending', async () => {
  const intent = fixtureIntent();
  assert.equal(await confirmSend(async () => ({}), intent), 'pending');
  const receipt = {
    id: intent.transaction.txID,
    blockNumber: 1234,
    receipt: { result: 'SUCCESS' },
    log: [
      {
        address: tronHex(TRON_USDT.contract).slice(2),
        topics: [
          'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          tronHex(OWNER.address).slice(2).padStart(64, '0'),
          tronHex(RECIPIENT).slice(2).padStart(64, '0'),
        ],
        data: BigInt(intent.units).toString(16).padStart(64, '0'),
      },
    ],
  };
  assert.equal(await confirmSend(async () => receipt, intent), 'confirmed');
  assert.equal(
    await confirmSend(
      async () => ({ ...receipt, receipt: { result: 'OUT_OF_ENERGY' } }),
      intent,
    ),
    'failed',
  );
  for (const result of ['BOGUS', 'UNKNOWN', 'DEFAULT', 1]) {
    await assert.rejects(
      confirmSend(async () => ({ ...receipt, receipt: { result } }), intent),
    );
  }
  await assert.rejects(
    confirmSend(async () => ({ ...receipt, log: [] }), intent),
  );
  await assert.rejects(
    confirmSend(async () => ({ ...receipt, id: 'other' }), intent),
  );
});
test('activity requires verified canonical transfer rows, genuine empty differs from unavailable', async () => {
  assert.deepEqual(
    await readActivity(
      async () => ({ success: true, data: [] }),
      OWNER.address,
    ),
    [],
  );
  const row = {
    transaction_id: '1'.repeat(64),
    token_info: { address: TRON_USDT.contract, decimals: 6 },
    type: 'Transfer',
    from: OWNER.address,
    to: RECIPIENT,
    value: '1000000',
    block_timestamp: 1700000000000,
  };
  assert.equal(
    (
      await readActivity(
        async () => ({ success: true, data: [row] }),
        OWNER.address,
      )
    )[0].units,
    '1000000',
  );
  for (const result of [
    null,
    {},
    { success: false, data: [] },
    {
      success: true,
      data: [{ ...row, token_info: { address: RECIPIENT, decimals: 6 } }],
    },
  ])
    await assert.rejects(readActivity(async () => result, OWNER.address));
});
test('creation and chain isolation are explicit in runtime adapters; no automatic EVM creation', () => {
  const provider = readFileSync(
    'src/providers/PrivyProviderWrapper.tsx',
    'utf8',
  );
  assert.doesNotMatch(provider, /users-without-wallets|all-users/);
  assert.match(provider, /createOnLogin: 'off'/);
  const hook = readFileSync('src/hooks/useTronWallet.ts', 'utf8');
  assert.match(hook, /chainType: 'tron'/);
  assert.doesNotMatch(
    hook,
    /useSendTransaction|useEthereumProvider|privateKey/,
  );
  assert.doesNotMatch(
    readFileSync('src/components/SendModal.tsx', 'utf8'),
    /signRawHash|chainType: 'tron'/,
  );
});
