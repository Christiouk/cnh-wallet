'use client';

import { useFundWallet } from '@privy-io/react-auth';

interface ActionButtonsProps {
  onSell: () => void;
  onSend: () => void;
  onReceive: () => void;
  onSwap?: () => void;
  walletAddress?: string;
}

// Filled SVG icons — cleaner and more recognisable than outlines at small sizes
const BuyIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const SellIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const ReceiveIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const SwapIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
  </svg>
);

const FundIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
  </svg>
);

export default function ActionButtons({
  onSell,
  onSend,
  onReceive,
  onSwap,
  walletAddress,
}: ActionButtonsProps) {
  const { fundWallet } = useFundWallet();

  const handleBuyOrFund = () => {
    if (walletAddress) {
      fundWallet({ address: walletAddress });
    }
  };

  const actions = [
    {
      label: 'Buy',
      icon: <BuyIcon />,
      onClick: handleBuyOrFund,
      // Emerald green — positive / add funds
      iconBg: 'bg-emerald-500/15 group-hover:bg-emerald-500/25',
      iconColor: 'text-emerald-400',
      glow: 'group-hover:shadow-[0_0_18px_rgba(52,211,153,0.25)]',
      border: 'group-hover:border-emerald-500/30',
    },
    {
      label: 'Sell',
      icon: <SellIcon />,
      onClick: onSell,
      // Amber — monetise / cash out
      iconBg: 'bg-amber-500/15 group-hover:bg-amber-500/25',
      iconColor: 'text-amber-400',
      glow: 'group-hover:shadow-[0_0_18px_rgba(251,191,36,0.2)]',
      border: 'group-hover:border-amber-500/30',
    },
    {
      label: 'Send',
      icon: <SendIcon />,
      onClick: onSend,
      // Brand blue — primary action
      iconBg: 'bg-brand-500/15 group-hover:bg-brand-500/25',
      iconColor: 'text-brand-400',
      glow: 'group-hover:shadow-[0_0_18px_rgba(51,165,255,0.25)]',
      border: 'group-hover:border-brand-500/30',
    },
    {
      label: 'Receive',
      icon: <ReceiveIcon />,
      onClick: onReceive,
      // Violet — incoming / receive
      iconBg: 'bg-violet-500/15 group-hover:bg-violet-500/25',
      iconColor: 'text-violet-400',
      glow: 'group-hover:shadow-[0_0_18px_rgba(167,139,250,0.25)]',
      border: 'group-hover:border-violet-500/30',
    },
    {
      label: 'Swap',
      icon: <SwapIcon />,
      onClick: onSwap || (() => {}),
      // Cyan — exchange / transform
      iconBg: 'bg-cyan-500/15 group-hover:bg-cyan-500/25',
      iconColor: 'text-cyan-400',
      glow: 'group-hover:shadow-[0_0_18px_rgba(34,211,238,0.2)]',
      border: 'group-hover:border-cyan-500/30',
    },
    {
      label: 'Fund',
      icon: <FundIcon />,
      onClick: handleBuyOrFund,
      // Rose/pink — funding / card
      iconBg: 'bg-rose-500/15 group-hover:bg-rose-500/25',
      iconColor: 'text-rose-400',
      glow: 'group-hover:shadow-[0_0_18px_rgba(251,113,133,0.2)]',
      border: 'group-hover:border-rose-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`
            group flex flex-col items-center justify-center gap-2.5 py-4 px-2
            rounded-2xl bg-surface-800/50 border border-surface-700/30
            transition-all duration-200 active:scale-[0.96]
            ${action.border} ${action.glow}
          `}
        >
          {/* Circular icon container with per-action tinted background */}
          <div
            className={`
              flex items-center justify-center
              w-10 h-10 rounded-full
              ${action.iconBg} ${action.iconColor}
              transition-all duration-200
            `}
          >
            {action.icon}
          </div>

          {/* Label */}
          <span className="text-[11px] font-semibold tracking-wide text-surface-400 group-hover:text-white transition-colors duration-200 uppercase">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
