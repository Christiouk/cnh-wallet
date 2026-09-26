import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function FixturePage() {
  const host = (await headers()).get('host') || '';
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.A3_TRON_FIXTURE_MODE !== '1' ||
    process.env.VERCEL ||
    !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
  )
    notFound();
  const Fixture = (await import('./fixture')).default;
  return <Fixture />;
}
