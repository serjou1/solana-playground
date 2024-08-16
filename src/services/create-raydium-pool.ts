import { Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Liquidity } from "@raydium-io/raydium-sdk";

import { RAYMint, USDCMint, OPEN_BOOK_PROGRAM, DEVNET_PROGRAM_ID, WSOLMint } from '@raydium-io/raydium-sdk-v2'
import { initSdk, txVersion } from '../config'

export const createPool = async (params: {
    baseInfo: {
        mint: PublicKey,
        decimals: number
    },
    quoteInfo: {
        mint: PublicKey,
        decimals: number
    },
    owner: Keypair
}) => {
    const {
        baseInfo,
        quoteInfo,
        owner
    } = params;

    const raydium = await initSdk({
        owner
    });

    // check mint info here: https://api-v3.raydium.io/mint/list
    // or get mint info by api: await raydium.token.getTokenInfo('mint address')

    const { execute, extInfo, transactions } = await raydium.marketV2.create({
        baseInfo,
        quoteInfo,
        lotSize: 1,
        tickSize: 0.01,
        // dexProgramId: OPEN_BOOK_PROGRAM,
        dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet

        // requestQueueSpace: 5120 + 12, // optional
        // eventQueueSpace: 262144 + 12, // optional
        // orderbookQueueSpace: 65536 + 12, // optional

        txVersion,
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 100000000,
        // },
    })

    console.log(
        `create market total ${transactions.length} txs, market info: `,
        Object.keys(extInfo.address).reduce(
            (acc, cur) => ({
                ...acc,
                [cur]: extInfo.address[cur as keyof typeof extInfo.address].toBase58(),
            }),
            {}
        )
    )

    console.log("Executing txs");


    const txIds = await execute({
        // set sequentially to true means tx will be sent when previous one confirmed
        sequentially: true,
    })

    console.log('create market txIds:', txIds)
};