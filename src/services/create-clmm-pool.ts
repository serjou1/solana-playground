import { Keypair, PublicKey } from "@solana/web3.js";
import { initSdk } from "../config";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { DEVNET_PROGRAM_ID, TxVersion } from "@raydium-io/raydium-sdk-v2";
import BN from 'bn.js'
import Decimal from 'decimal.js'

export const createClmmPool = async ({ owner, mint1Pk, mint2Pk, initialPrice }: {
  owner: Keypair,
  mint1Pk: string,
  mint2Pk: string,
  initialPrice: number
}) => {
  const raydium = await initSdk({
    owner,
    loadToken: true
  });

  const mint1 = await raydium.token.getTokenInfo(mint1Pk);
  const mint2 = await raydium.token.getTokenInfo(mint2Pk);
  const clmmConfigs = devConfigs;

  const ammConfig = { ...clmmConfigs[0], id: new PublicKey(clmmConfigs[0].id), fundOwner: '', description: '' }

  const params = {
    programId: DEVNET_PROGRAM_ID.CLMM,
    mint1,
    mint2,
    ammConfig,
    initialPrice: new Decimal(initialPrice),
    startTime: new BN(0),
    txVersion: TxVersion.V0,
  }

  const { execute, extInfo } = await raydium.clmm.createPool(params);


  console.log("AMM\n\n", ammConfig);

  const { txId } = await execute({ sendAndConfirm: true })
  console.log('clmm pool created:', { txId });

  return extInfo.address.id
};

export const devConfigs = [
  {
    id: 'CQYbhr6amxUER4p5SC44C63R4qw4NFc9Z4Db9vF4tZwG',
    index: 0,
    protocolFeeRate: 120000,
    tradeFeeRate: 100,
    tickSpacing: 10,
    fundFeeRate: 40000,
    description: 'Best for very stable pairs',
    defaultRange: 0.005,
    defaultRangePoint: [0.001, 0.003, 0.005, 0.008, 0.01],
  },
  {
    id: 'B9H7TR8PSjJT7nuW2tuPkFC63z7drtMZ4LoCtD7PrCN1',
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    tickSpacing: 60,
    fundFeeRate: 40000,
    description: 'Best for most pairs',
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
  },
  {
    id: 'GjLEiquek1Nc2YjcBhufUGFRkaqW1JhaGjsdFd8mys38',
    index: 3,
    protocolFeeRate: 120000,
    tradeFeeRate: 10000,
    tickSpacing: 120,
    fundFeeRate: 40000,
    description: 'Best for exotic pairs',
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
  },
  {
    id: 'GVSwm4smQBYcgAJU7qjFHLQBHTc4AdB3F2HbZp6KqKof',
    index: 2,
    protocolFeeRate: 120000,
    tradeFeeRate: 500,
    tickSpacing: 10,
    fundFeeRate: 40000,
    description: 'Best for tighter ranges',
    defaultRange: 0.1,
    defaultRangePoint: [0.01, 0.05, 0.1, 0.2, 0.5],
  },
]