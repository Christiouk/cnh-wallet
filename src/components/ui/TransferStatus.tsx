'use client';
export function friendlyError(message: string) {
  // Keep actionable validation copy; never render arbitrary SDK/provider internals.
  const safe =
    /^(Enter |Amount |Insufficient |Network cost |Tron provider |Ethereum provider |Transfer simulation unavailable|Invalid Tron recipient|Network resource required|Tron setup |Your |The transaction reverted|The signing request|Confirmation |The network rejected|Submission could not|Pending transfer record|Estimated network cost increased|Invalid USDT amount|Unsupported asset|Authorization cancelled|Unable to load|Some balances)/;
  return message.length <= 300 &&
    safe.test(message) &&
    !/[\n{}<>]/.test(message)
    ? message
    : 'This request could not be completed. Check your details and try again. If you already approved it, check Activity before sending again.';
}
export default function TransferStatus({
  stage,
  network,
}: {
  stage: string;
  network: string;
}) {
  const labels: Record<string, string> = {
    review: 'Review your transfer',
    'requesting-signature': 'Requesting approval',
    signing: 'Requesting authorization…',
    submitted: 'Submitted — awaiting network confirmation',
    confirming: `Confirming on ${network}…`,
    confirmed: 'Transfer confirmed',
    failed: 'Transfer failed',
  };
  const descriptions: Record<string, string> = {
    review: 'Check the details before you continue.',
    'requesting-signature':
      'Approve this transfer in your wallet. Signing has not completed.',
    signing: 'Approve this transfer in your wallet.',
    submitted: 'Your transfer has been submitted. It is not confirmed yet.',
    confirming: 'Waiting for the network. Please do not send again.',
    confirmed: `Confirmed by the ${network} network.`,
    failed: 'Review the message below before taking another action.',
  };
  return (
    <div role="status" className={`transfer-status status-${stage}`}>
      <span className="status-symbol" aria-hidden>
        {stage === 'confirmed'
          ? '✓'
          : stage === 'failed'
            ? '!'
            : stage === 'review'
              ? '↗'
              : '…'}
      </span>
      <h3>{labels[stage] || stage}</h3>
      <p>{descriptions[stage]}</p>
    </div>
  );
}
