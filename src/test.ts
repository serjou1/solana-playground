import { CLMM_PROGRAM_ID, DEVNET_PROGRAM_ID, TxVersion } from '@raydium-io/raydium-sdk-v2'
import { PublicKey } from '@solana/web3.js'
import { initSdk, txVersion } from './config'
import Decimal from 'decimal.js'
import BN from 'bn.js'
import { devConfigs } from './services/create-clmm-pool'
// import { devConfigs } from './utils'

// import { CLMM_PROGRAM_ID, DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk-v2'

const VALID_PROGRAM_ID = new Set([CLMM_PROGRAM_ID.toBase58(), DEVNET_PROGRAM_ID.CLMM.toBase58()])

export const isValidClmm = (id: string) => VALID_PROGRAM_ID.has(id)

export const createPool = async () => {
    const raydium = await initSdk({ loadToken: true })

    // you can call sdk api to get mint info or paste mint info from api: https://api-v3.raydium.io/mint/list
    // RAY
    const mint1 = await raydium.token.getTokenInfo('5tNJZakcpZW29rBsjnrbgSVAb1mqUw2bockEzuKq1GQg')
    // USDT
    const mint2 = await raydium.token.getTokenInfo('BTaJd8JHAeGNWRcbUeoJua3oke3iy3Qjt4kBAJVC9gWv')
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

/** uncomment code below to execute */
createPool()
