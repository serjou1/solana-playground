import {
    clusterApiUrl,
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js';

import {
    ExtensionType,
    createInitializeMintInstruction,
    mintTo,
    createAccount,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    unpackAccount,
    getTransferFeeAmount,
    setTransferFee,
} from '@solana/spl-token';

import {
    createInitializeTransferFeeConfigInstruction,
    harvestWithheldTokensToMint,
    transferCheckedWithFee,
    withdrawWithheldTokensFromAccounts,
    withdrawWithheldTokensFromMint,
} from '@solana/spl-token';


import bs58 from "bs58";
import { TokenParams } from '../types';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export const createNewMint = async (params: {
    payer: Keypair,
    transferFeeConfigAuthority: Keypair,
    withdrawWithheldAuthority: Keypair,
    mintAuthority: Keypair,
    mintKeypair: Keypair,
    tokenParams: TokenParams
}) => {
    const {
        payer,
        transferFeeConfigAuthority,
        withdrawWithheldAuthority,
        mintAuthority,
        mintKeypair,
        tokenParams
    } = params;

    const {
        decimals,
        feeBasisPoints,
        maxFee
    } = tokenParams;

    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            transferFeeConfigAuthority.publicKey,
            withdrawWithheldAuthority.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(mint, decimals, mintAuthority.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );

    const tx = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintKeypair], undefined);

    console.log('====================');
    console.log();
    console.log(`Create mint tx: ${tx}`);
    console.log();
    console.log('====================');
    console.log();
};

export const createTokenAccount = async (params: {
    payer: Keypair,
    mint: PublicKey,
    owner: Keypair
}) => {
    const {
        payer,
        mint,
        owner
    } = params;

    const sourceAccount = await createAccount(
        connection,
        payer,
        mint,
        owner.publicKey,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    return sourceAccount;
}

export const mintTokens = async (info: {
    payer: Keypair,
    mint: PublicKey,
    mintAuthority: Keypair,
    destinationsAccount: PublicKey
}) => {
    const {
        payer,
        mint,
        mintAuthority,
        destinationsAccount
    } = info;

    const mintAmount = BigInt(1_000_000_000);

    const tx = await mintTo(
        connection,
        payer,
        mint,
        destinationsAccount,
        mintAuthority,
        mintAmount,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    console.log('====================');
    console.log();
    console.log(`Mint tx: ${tx}`);
    console.log();
    console.log('====================');
    console.log();
}

export const transferTokensToAccount = async (params: {
    payer: Keypair,
    mint: PublicKey,
    owner: Keypair,
    feeBasisPoints: number,
    decimals: number,
    sourceAccount: PublicKey,
    destinationAccount: PublicKey
}) => {
    const {
        payer,
        mint,
        owner,
        feeBasisPoints,
        decimals,
        sourceAccount,
        destinationAccount
    } = params;

    const transferAmount = BigInt(1_000_000);
    const fee = (transferAmount * BigInt(feeBasisPoints)) / BigInt(10_000);
    const tx = await transferCheckedWithFee(
        connection,
        payer,
        sourceAccount,
        mint,
        destinationAccount,
        owner,
        transferAmount,
        decimals,
        fee,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    console.log('====================');
    console.log();
    console.log(`Transfer with fee tx ${tx}`);
    console.log();
    console.log('====================');
    console.log();
};

export const withdrawFee = async (params: {
    mint: PublicKey,
    payer: Keypair,
    destinationAccount: PublicKey,
    withdrawWithheldAuthority: Keypair
}) => {
    const {
        mint,
        payer,
        destinationAccount,
        withdrawWithheldAuthority
    } = params;

    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
        commitment: 'confirmed',
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: mint.toString(),
                },
            },
        ],
    });

    const accountsToWithdrawFrom = [];
    for (const accountInfo of allAccounts) {
        const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
        const transferFeeAmount = getTransferFeeAmount(account);
        if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
            accountsToWithdrawFrom.push(accountInfo.pubkey);
        }
    }

    const tx = await withdrawWithheldTokensFromAccounts(
        connection,
        payer,
        mint,
        destinationAccount,
        withdrawWithheldAuthority,
        [],
        [destinationAccount],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    console.log('====================');
    console.log();
    console.log(`Withdraw fee tx ${tx}`);
    console.log();
    console.log('====================');
    console.log();
};

export const changeTransferFee = async (params: {
    payer: Keypair,
    mint: PublicKey,
    transferFeeConfigAuthority: Keypair
}) => {
    const {
        payer,
        mint,
        transferFeeConfigAuthority
    } = params;

    const tx = await setTransferFee(
        connection,
        payer,
        mint,
        transferFeeConfigAuthority,
        [],
        500,
        BigInt(1_000_000_000)
    )

    console.log('====================');
    console.log();
    console.log(`Change fee tx ${tx}`);
    console.log();
    console.log('====================');
    console.log();
}