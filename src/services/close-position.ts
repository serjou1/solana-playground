import { ApiV3PoolInfoConcentratedItem, ClmmKeys } from '@raydium-io/raydium-sdk-v2'
import { initSdk, txVersion } from '../config'
import { Keypair } from '@solana/web3.js'
// import { isValidClmm } from './utils'

export const closePosition = async ({
    poolId,
    owner
}: {
    poolId: string,
    owner: Keypair
}) => {
    const raydium = await initSdk({ owner })
    let poolInfo: ApiV3PoolInfoConcentratedItem
    // SOL-USDC pool
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

    const allPosition = await raydium.clmm.getOwnerPositionInfo({ programId: poolInfo.programId })
    if (!allPosition.length) throw new Error('use do not have position')

    const position = allPosition.find((p) => p.poolId.toBase58() === poolInfo.id)
    if (!position) throw new Error(`use do not have position in pool: ${poolInfo.id}`)

    const { execute } = await raydium.clmm.closePosition({
        poolInfo,
        poolKeys,
        ownerPosition: position,
        txVersion,
    })

    // don't want to wait confirm, set sendAndConfirm to false or don't pass any params to execute
    const { txId } = await execute({ sendAndConfirm: true })
    console.log('clmm position closed:', { txId })
}

/** uncomment code below to execute */
// closePosition()
