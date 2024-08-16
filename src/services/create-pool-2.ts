import {
    MarketV2,
    DEVNET_PROGRAM_ID,
    TxVersion,
    buildSimpleTransaction
} from '@raydium-io/raydium-sdk';
import { Connection, Keypair, Signer, Transaction, VersionedTransaction } from '@solana/web3.js';

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export const createPool2 = async (params: {
    payer: Keypair,
    baseInfo,
    quoteInfo
}) => {
    const {
        payer,
        baseInfo,
        quoteInfo
    } = params;
    

    // -------- step 1: make instructions --------
    const createMarketInstruments = await MarketV2.makeCreateMarketInstructionSimple({
        connection,
        wallet: payer.publicKey,
        baseInfo,
        quoteInfo,
        lotSize: 1, // default 1
        tickSize: 0.01, // default 0.01
        dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
        makeTxVersion: TxVersion.V0,
    })

    const marketId = createMarketInstruments.address.marketId

    const txs = await buildSimpleTransaction({
        connection,
        makeTxVersion: TxVersion.V0,
        payer: payer.publicKey,
        innerTransactions: createMarketInstruments.innerTransactions,
    });

    const sentTx = await sendTx(connection, payer, txs)
    console.log(sentTx);
    

    return marketId
};

export async function sendTx(
    connection: Connection,
    payer: Keypair | Signer,
    txs: (VersionedTransaction | Transaction)[],
    // options?: ConfirmOptions,
  ): Promise<string[]> {
    function sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    sleep(1000);
    const txids: string[] = [];
    for (const iTx of txs) {
      if (iTx instanceof VersionedTransaction) {
        // Sign the VersionedTransaction
        iTx.sign([payer]);
        txids.push(await connection.sendTransaction(iTx));
      }
    }
    return txids;
  }
  