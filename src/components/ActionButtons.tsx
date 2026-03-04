'use client';

import { useFundWallet } from '@privy-io/react-auth';

interface ActionButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  onSend: () => void;
  onReceive: () => void;
  onSwap?: () => void;
  walletAddress?: string;
}

export default function ActionButtons({ onBuy, onSell, onSend, onReceive, onSwap, walletAddress }: ActionButtonsProps) {
  const { fundWallet } = useFundWallet();

  const handleFund = () => {
    if (walletAddress) {
      fundWallet({ address: walletAddress });
    }
  };

  const actions = [
    {
      label: 'Buy',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: onBuy,
      color: 'text-emerald-400',
    },
    {
      label: 'Sell',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      ),
      onClick: onSell,
      color: 'text-orange-400',
    },
    {
      label: 'Send',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      onClick: onSend,
      color: 'text-brand-400',
    },
    {
      label: 'Receive',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      onClick: onReceive,
      color: 'text-purple-400',
    },
    {
      label: 'Swap',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
      onClick: onSwap || (() => {}),
      color: 'text-cyan-400',
    },
    {
      label: 'Fund',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      onClick: handleFund,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="btn-action group"
        >
          <div className={`${action.color} transition-transform duration-200 group-hover:scale-110`}>
            {action.icon}
          </div>
          <span className="text-xs font-medium text-surface-300 group-hover:text-white transition-colors">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
