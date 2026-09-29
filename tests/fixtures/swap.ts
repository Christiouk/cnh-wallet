import { encodeFunctionData } from 'viem';
import {
  ASSETS,
  HOLDER,
  sellUnits,
  holderAbi,
  settlerAbi,
  type Intent,
} from '../../src/lib/swap/core';
export const owner = '0x1111111111111111111111111111111111111111';
export const settler = '0x2222222222222222222222222222222222222222';
export function quote(i: Intent) {
  const amount = sellUnits(i),
    minimum = 990000n;
  const data = encodeFunctionData({
    abi: settlerAbi,
    functionName: 'execute',
    args: [
      {
        recipient: owner,
        buyToken: ASSETS[i.buyAsset].address,
        minAmountOut: minimum,
      },
      ['0x12345678'],
      ('0x' + '0'.repeat(64)) as `0x${string}`,
    ],
  });
  return {
    liquidityAvailable: true,
    sellToken: ASSETS[i.sellAsset].address,
    buyToken: ASSETS[i.buyAsset].address,
    sellAmount: amount.toString(),
    buyAmount: '1000000',
    minBuyAmount: minimum.toString(),
    fees: { integratorFee: null, zeroExFee: null },
    allowanceTarget: HOLDER,
    issues: {
      balance: null,
      allowance: null,
      invalidSourcesPassed: [],
      simulationIncomplete: false,
    },
    transaction: {
      to: i.sellAsset === 'ETH' ? settler : HOLDER,
      value: i.sellAsset === 'ETH' ? amount.toString() : '0',
      gas: '200000',
      gasPrice: '1000000000',
      data:
        i.sellAsset === 'ETH'
          ? data
          : encodeFunctionData({
              abi: holderAbi,
              functionName: 'exec',
              args: [
                settler,
                ASSETS[i.sellAsset].address,
                amount,
                settler,
                data,
              ],
            }),
    },
  };
}
