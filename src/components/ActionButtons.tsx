'use client';

interface ActionButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  onSend: () => void;
  onReceive: () => void;
}

export default function ActionButtons({ onBuy, onSell, onSend, onReceive }: ActionButtonsProps) {
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
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
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
