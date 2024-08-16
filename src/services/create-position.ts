import { ApiV3PoolInfoConcentratedItem, TickUtils, PoolUtils, ClmmKeys } from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import { initSdk, txVersion } from '../config'
import Decimal from 'decimal.js'
// import { isValidClmm } from './utils'
import { Keypair } from '@solana/web3.js'

export const createPosition = async ({
    payer,
    poolId,
    inputAmount,
    startPrice,
    endPrice
}: {
    payer: Keypair,
    poolId: string,
    inputAmount: number,
    startPrice: number,
    endPrice: number
}) => {
    const raydium = await initSdk({
        owner: payer
    })

    let poolInfo: ApiV3PoolInfoConcentratedItem

    let poolKeys: ClmmKeys | undefined

    if (raydium.cluster === 'mainnet') {
        // note: api doesn't support get devnet pool info, so in devnet else we go rpc method
        // if you wish to get pool info from rpc, also can modify logic to go rpc method directly
        const data = await raydium.api.fetchPoolById({ ids: poolId })
        poolInfo = data[0] as ApiV3PoolInfoConcentratedItem
        // if (!isValidClmm(poolInfo.programId)) throw new Error('target pool is not CLMM pool')
    } else {
        const data = await raydium.clmm.getPoolInfoFromRpc(poolId)
        poolInfo = data.poolInfo
        poolKeys = data.poolKeys
    }

    /** code below will get on chain realtime price to avoid slippage error, uncomment it if necessary */
    // const rpcData = await raydium.clmm.getRpcClmmPoolInfo({ poolId: poolInfo.id })
    // poolInfo.price = rpcData.currentPrice

    const { tick: lowerTick } = TickUtils.getPriceAndTick({
        poolInfo,
        price: new Decimal(startPrice),
        baseIn: true,
    })

    const { tick: upperTick } = TickUtils.getPriceAndTick({
        poolInfo,
        price: new Decimal(endPrice),
        baseIn: true,
    })

    const epochInfo = await raydium.fetchEpochInfo()
    const res = await PoolUtils.getLiquidityAmountOutFromAmountIn({
        poolInfo,
        slippage: 0,
        inputA: true,
        tickUpper: Math.max(lowerTick, upperTick),
        tickLower: Math.min(lowerTick, upperTick),
        amount: new BN(new Decimal(inputAmount || '0').mul(10 ** poolInfo.mintA.decimals).toFixed(0)),
        add: true,
        amountHasFee: true,
        epochInfo: epochInfo,
    });

    console.log(res);





    const { execute, extInfo } = await raydium.clmm.openPositionFromBase({
        poolInfo,
        poolKeys,
        tickUpper: Math.max(lowerTick, upperTick),
        tickLower: Math.min(lowerTick, upperTick),
        base: 'MintA',
        ownerInfo: {
            // useSOLBalance: true,
        },
        baseAmount: new BN(new Decimal(inputAmount || '0').mul(10 ** poolInfo.mintA.decimals).toFixed(0)),
        otherAmountMax: res.amountSlippageB.amount,
        txVersion,
        // optional: set up priority fee here
        computeBudgetConfig: {
            units: 600000,
            microLamports: 100000,
        },
    })

    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = await execute({ sendAndConfirm: true })
    console.log('clmm position opened:', { txId, nft: extInfo.nftMint.toBase58() })
}