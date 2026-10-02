import { PreviewLogin } from '@/components/LoginView';
import WalletApp from '@/components/WalletApp';

export default function Home() {
  // Keep the locked Preview dependency graph separate from the authentication SDK.
  if (process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED === 'true') return <PreviewLogin />;
  return <WalletApp />;
}
