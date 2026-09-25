import { formatUnits } from 'viem';

export function formatBalance(balance: string, decimals = 18): string {
  return formatUnits(BigInt(balance), decimals);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
