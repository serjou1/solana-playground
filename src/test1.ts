import { CLMM_PROGRAM_ID, DEVNET_PROGRAM_ID, TxVersion } from '@raydium-io/raydium-sdk-v2'
import { PublicKey } from '@solana/web3.js'
// import { initSdk, txVersion } from '../config'
import Decimal from 'decimal.js'
import BN from 'bn.js'
import { initSdk } from './test2'
// import { devConfigs } from './utils'

export const createPool = async () => {
    const raydium = await initSdk({ loadToken: true })

    // you can call sdk api to get mint info or paste mint info from api: https://api-v3.raydium.io/mint/list
    // RAY
    const mint1 = await raydium.token.getTokenInfo('8RopF2FqmCTNHBqv4u6JgrJpXsp29XowVJ8t9zHdEZap')
    // USDT
    const mint2 = await raydium.token.getTokenInfo('FENzVj7eHWZMt7oK5HvpTYsDf8APsJzyVGbp2KqUZJqm')
    // const clmmConfigs = await raydium.api.getClmmConfigs()
    const clmmConfigs = devConfigs // devnet configs


    const params = {
        // programId: CLMM_PROGRAM_ID,
        programId: DEVNET_PROGRAM_ID.CLMM,
        mint1,
        mint2,
        ammConfig: { ...clmmConfigs[0], id: new PublicKey(clmmConfigs[0].id), fundOwner: '', description: '' },
        initialPrice: new Decimal(1),
        startTime: new BN(0),
        txVersion: TxVersion.V0,
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 100000000,
        // },
    }

    console.log(params);


    const { execute } = await raydium.clmm.createPool(params);
    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = await execute({ sendAndConfirm: true })
    console.log('clmm pool created:', { txId })
}


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

/** uncomment code below to execute */
createPool()
