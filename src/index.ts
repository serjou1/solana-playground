import { Keypair } from "@solana/web3.js";
import { changeTransferFee, createNewMint, createTokenAccount, mintTokens, transferTokensToAccount, withdrawFee } from "./services/create-extended-2";
import { createExtendedToken } from "./services/create-extended-token";
import { createTokenWithTransferFee } from "./services/create-token-with-trasfer-fee";


import bs58 from "bs58";
import { TokenParams } from "./types";

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const main = async () => {
    const payer = Keypair.fromSecretKey(bs58.decode("2x8h7ZPWGWRoWiQwJNgTziNS4hpzzmUMUJKvsnZohYfzY8cCtwWfqjvRrG3vdcwi48GMTHyYKmxFVXf4AaETWhSm"));
    console.log(`Payeer: ${payer.publicKey.toBase58()}`);
    const mintAuthority = Keypair.fromSecretKey(bs58.decode("4R4HDkZk15CwjJPpnmTHhCBU3BJfNZrkzPVyc1gxqfFxrCnPg5vKn2fjtfRQCamozyMSs7Njpur6NueYXGwt4nBm"));
    console.log(`Mint auth: ${mintAuthority.publicKey.toBase58()}`);
    const transferFeeConfigAuthority = Keypair.fromSecretKey(bs58.decode("2tgTDQgfDwX9eFCx5Z45QNUBk96ttWHwTSmZjtyzwNa4DfZP82xD86HNmcfpoDPU9TCfSfLeuzJGsFGzX3xzvRXM"));
    console.log(`Transfer fee auth: ${transferFeeConfigAuthority.publicKey.toBase58()}`);
    const withdrawWithheldAuthority = Keypair.fromSecretKey(bs58.decode("4EA1PXskBaQzbbxSqBCsrSYsLoznvHGLi6UjTVySViRKxm5GfWzofxGcG4EXN1psjqqiG6TJUMzRLu97WDwcaXWP"));
    console.log(`Withdraw auth: ${withdrawWithheldAuthority.publicKey.toBase58()}`);

    // create mint
    const tokenParams: TokenParams = {
        decimals: 9,
        feeBasisPoints: 50,
        maxFee: BigInt(5_000)
    };

    const mintKeypair = Keypair.generate();
    console.log();
    console.log(`Mint: ${mintKeypair.publicKey.toBase58()}`);
    console.log();

    await createNewMint({
        payer,
        mintAuthority,
        mintKeypair,
        transferFeeConfigAuthority,
        withdrawWithheldAuthority,
        tokenParams
    });

    // mint token to account
    const tokensOwner = Keypair.fromSecretKey(bs58.decode("5PKxr1dmZGn5vVsZDQKzhUZVWk3uwPRrarDbSJ8NDiWAxXuYt1dRZo9fKo1BHVDEBJyG1mUiKCFh9MtLK9Y5Z76G"));
    const sourceAccount = await createTokenAccount({
        payer,
        mint: mintKeypair.publicKey,
        owner: tokensOwner
    });

    console.log();
    console.log('-------------');
    console.log();
    console.log(`Source account owner: ${tokensOwner.publicKey.toBase58()}`);
    console.log(`Source account: ${sourceAccount.toBase58()}`);
    console.log();
    console.log('-------------');
    console.log();

    await mintTokens({
        payer,
        mint: mintKeypair.publicKey,
        mintAuthority,
        destinationsAccount: sourceAccount
    });

    // transfer token to another account
    const destinationKeypair = Keypair.fromSecretKey(bs58.decode("3BxswTxydL5nDMiM4CZ7vrjJH7F5QdmsqUkPXXwRKNrfugssVCwBaKA7gdxw3mEZf4YiHs9ZV5AfgNfXESoExMHn"));
    const destinationAccount = await createTokenAccount({
        payer,
        mint: mintKeypair.publicKey,
        owner: destinationKeypair
    });

    console.log();
    console.log('-------------');
    console.log();
    console.log(`Destination account owner: ${destinationKeypair.publicKey.toBase58()}`)
    console.log(`Destination account: ${destinationAccount.toBase58()}`);
    console.log();
    console.log('-------------');
    console.log();

    await transferTokensToAccount({
        payer,
        mint: mintKeypair.publicKey,
        owner: tokensOwner,
        feeBasisPoints: tokenParams.feeBasisPoints,
        decimals: tokenParams.decimals,
        sourceAccount,
        destinationAccount
    });

    // withdraw fee
    await withdrawFee({
        mint: mintKeypair.publicKey,
        payer,
        destinationAccount,
        withdrawWithheldAuthority
    });

    // change fee
    await changeTransferFee({
        payer,
        transferFeeConfigAuthority,
        mint: mintKeypair.publicKey
    });

    await sleep(10000)

    // transfer token with wrong fee 
    await transferTokensToAccount({
        payer,
        mint: mintKeypair.publicKey,
        owner: tokensOwner,
        feeBasisPoints: tokenParams.feeBasisPoints,
        decimals: tokenParams.decimals,
        sourceAccount,
        destinationAccount
    });
};

main();