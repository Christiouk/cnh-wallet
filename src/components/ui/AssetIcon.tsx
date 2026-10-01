import Image from 'next/image';

const icons: Record<string, string> = {
  ETH: '/tokens/eth.svg',
  USDT: '/tokens/usdt.svg',
  USDC: '/tokens/usdc.svg',
  TRX: '/tokens/trx.svg',
};

/** Decorative artwork: every use has an adjacent, explicit asset/network label. */
export default function AssetIcon({
  symbol,
  size = 36,
}: {
  symbol: string;
  size?: number;
}) {
  const src = icons[symbol];
  if (!src) return null;
  return (
    <Image
      className="asset-icon"
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      unoptimized
    />
  );
}
