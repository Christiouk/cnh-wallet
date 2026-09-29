import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function BuyReturn({
  searchParams,
}: {
  searchParams: Promise<{ network?: string }>;
}) {
  const network =
    (await searchParams).network === 'tron' ? 'tron' : 'ethereum';
  // Query parameters and provider redirects are not evidence of completion.
  return (
    <main className="buy-return">
      <p className="eyebrow">A3 WALLET / BUY</p>
      <h1>Back from Transak.</h1>
      <p>
        Returning here does not confirm a purchase. Return to your original
        A3 tab to check your order status and refresh the selected wallet.
      </p>
      <p>
        You can close this tab. If the original tab is no longer open, sign
        in to view your balance and on-chain activity.
      </p>
      <Link className="btn-primary" href={`/?network=${network}`}>
        Open A3 Wallet
      </Link>
    </main>
  );
}
