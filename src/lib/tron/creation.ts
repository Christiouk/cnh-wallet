import {
  assertContinuity,
  identity,
  selectTron,
  type UserSnapshot,
} from './core';
export interface CreationPort {
  current(): Promise<UserSnapshot>;
  create(): Promise<UserSnapshot>;
  attempted(did: string): boolean;
  markAttempt(did: string): void;
  lock<T>(did: string, action: () => Promise<T>): Promise<T>;
}
/** No calls on login. Persistent attempt marker prevents retry after uncertain completion. */
export async function enableTron(
  port: CreationPort,
  expectedDid: string,
  confirmed: boolean,
) {
  if (!confirmed) throw new Error('Confirm Enable Tron first');
  return port.lock(expectedDid, async () => {
    const before = await port.current();
    if (before.id !== expectedDid) throw new Error('Account changed');
    const selection = selectTron(before);
    if (selection.status === 'ready') return before;
    if (selection.status !== 'missing')
      throw new Error('Tron wallet selection requires verification');
    if (port.attempted(expectedDid))
      throw new Error(
        'A Tron setup request was already made. Refresh to rediscover it; contact support if it remains unavailable.',
      );
    port.markAttempt(expectedDid);
    const created = await port.create();
    assertContinuity(before, created);
    const discovered = await port.current();
    assertContinuity(before, discovered);
    if (selectTron(discovered).status !== 'ready')
      throw new Error(
        'Tron setup needs verification. Refresh; do not create another wallet.',
      );
    if (
      JSON.stringify(identity(created)) !== JSON.stringify(identity(discovered))
    )
      throw new Error('Created wallet could not be verified. Contact support.');
    return discovered;
  });
}
