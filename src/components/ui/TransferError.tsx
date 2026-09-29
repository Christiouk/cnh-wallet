import { friendlyError } from './TransferStatus';

/** Presentation only: retain the controller's error and all retry/signing decisions. */
export default function TransferError({ message }: { message: string }) {
  const safeMessage = friendlyError(message);
  if (safeMessage.startsWith('Network resource required')) {
    return (
      <div role="alert" className="notice resource-notice">
        <strong>Network resource required</strong>
        <p>
          USDT transfers on Tron use network resources. This address may need
          TRX to cover the network cost. This is not an A3 charge.
        </p>
        <details>
          <summary tabIndex={0}>Network details</summary>
          <p>{safeMessage}</p>
        </details>
      </div>
    );
  }
  return (
    <p role="alert" className="notice">
      {safeMessage}
    </p>
  );
}
