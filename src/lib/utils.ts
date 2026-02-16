export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function generateReferenceCode(identifier: string): string {
  if (!identifier) return 'CNH-000000';
  const hash = identifier
    .split('')
    .reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc + code) | 0;
    }, 0);
  const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
  return `CNH-${code.padStart(8, '0')}`;
}

export function formatBalance(balance: string, decimals: number = 18): string {
  if (!balance || balance === '0') return '0';
  const num = Number(balance) / Math.pow(10, decimals);
  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  if (num < 1000000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
