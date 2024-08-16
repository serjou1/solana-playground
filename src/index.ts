import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { changeTransferFee, createNewMint, createTokenAccount, mintTokens, transferTokensToAccount, withdrawFee } from "./services/create-extended-2";
import { createExtendedToken } from "./services/create-extended-token";
import { createTokenWithTransferFee } from "./services/create-token-with-trasfer-fee";


import bs58 from "bs58";
import { TokenParams } from "./types";
import { createPool } from "./services/create-raydium-pool";
import { createPool2 } from "./services/create-pool-2";
import { createClmmPool } from "./services/create-clmm-pool";
import { TokenMetadata } from "@solana/spl-token-metadata";
import { createPosition } from "./services/create-position";
import { trade } from "./services/trade";

const payer = Keypair.fromSecretKey(bs58.decode("2x8h7ZPWGWRoWiQwJNgTziNS4hpzzmUMUJKvsnZohYfzY8cCtwWfqjvRrG3vdcwi48GMTHyYKmxFVXf4AaETWhSm"));
console.log(`Payeer: ${payer.publicKey.toBase58()}`);

const trader = Keypair.fromSecretKey(bs58.decode("mVoYrM83XCrBq5uZqTrMtdHK6qsDJXrsMptm1KK3cppXUwSCGUTFMdrZA3F9DCTpCmjJykdcCFvM7QQgTEXyk4d"));
console.log("Trader:", trader.publicKey.toBase58());


export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logMassive = (...params) => {
    console.log("========================")
    console.log();
    console.log(...params);
    console.log();
    console.log("========================")
}

const main4 = async () => {

    const executionPrice = await trade({
        owner: trader,
        inputAmount: 2000_000_000_000,
        inputMint: new PublicKey("Wos9Qe9vtkxgDyvvq8fdryLDKhVPsAF24yP9P7DfXK4"),
        outputMint: new PublicKey("3NQLBRbD8Ymms2KyRfzey1vRaHYPfQipexR36FvwLH4V"),
        onlyCalculate: false
    });

    logMassive("Execution price:", executionPrice)

    return;

    const usdtKp = Keypair.generate();

    await createNewMint({
        payer,
        transferFeeConfigAuthority: null,
        withdrawWithheldAuthority: null,
        mintAuthority: payer,
        mintKeypair: usdtKp,
        tokenParams: {
            decimals: 9,
            feeBasisPoints: null,
            maxFee: null
        },
        metaData: {
            mint: usdtKp.publicKey,
            uri: null,
            name: "Tetherchik",
            symbol: "USDTC",
            additionalMetadata: [["a", "b"]],
            updateAuthority: payer.publicKey
        },
        deployWithFee: false
    });

    logMassive("Deployed USDT:", usdtKp.publicKey.toBase58())

    const argentumKp = Keypair.generate();

    await createNewMint({
        payer,
        transferFeeConfigAuthority: payer,
        withdrawWithheldAuthority: payer,
        mintAuthority: payer,
        mintKeypair: argentumKp,
        tokenParams: {
            decimals: 9,
            feeBasisPoints: 500,
            maxFee: BigInt(1000000000000)
        },
        metaData: {
            mint: argentumKp.publicKey,
            uri: null,
            name: "Argentum",
            symbol: "ARG",
            additionalMetadata: [["a", "b"]],
            updateAuthority: payer.publicKey
        },
        deployWithFee: true
    });

    logMassive("Argentum:", argentumKp.publicKey.toBase58());

    /////////////////////////

    // mint tokens to payeer

    const payyerUsdtAccount = await createTokenAccount({
        payer,
        mint: usdtKp.publicKey,
        owner: payer
    });

    await mintTokens({
        payer,
        mint: usdtKp.publicKey,
        mintAuthority: payer,
        destinationsAccount: payyerUsdtAccount,
        amount: 10_000_000
    });

    const payerArgAccount = await createTokenAccount({
        payer,
        mint: argentumKp.publicKey,
        owner: payer
    });

    await mintTokens({
        payer,
        mint: argentumKp.publicKey,
        mintAuthority: payer,
        destinationsAccount: payerArgAccount,
        amount: 3_000
    });

    const startPrice = 1000;
    const endPrice = 1100;

    const initialPrice = (startPrice + endPrice) / 2;


    // return;
    // // await sleep(20000)

    // // create pool on raydium
    const poolId = await createClmmPool(
        {
            owner: payer,
            mint1Pk: argentumKp.publicKey.toBase58(),
            mint2Pk: usdtKp.publicKey.toBase58(),
            initialPrice: initialPrice
        }
    );

    logMassive("Pool is created:", poolId)

    // add liquidity 
    await createPosition({
        payer,
        poolId,
        inputAmount: 2000,
        startPrice,
        endPrice
    });

    // mint tokens to trader account
    const traderUsdtAccount = await createTokenAccount({
        payer,
        mint: usdtKp.publicKey,
        owner: trader
    });

    await mintTokens({
        payer,
        mint: usdtKp.publicKey,
        mintAuthority: payer,
        destinationsAccount: traderUsdtAccount,
        amount: 100000
    });

    const traderArgAccount = await createTokenAccount({
        payer,
        mint: argentumKp.publicKey,
        owner: trader
    });

    await mintTokens({
        payer,
        mint: argentumKp.publicKey,
        mintAuthority: payer,
        destinationsAccount: traderArgAccount,
        amount: 100
    });


    /////////////////////////

    await sleep(10000);

    // get price
    // const executionPrice = await trade({
    //     owner: payer,
    //     inputAmount: 100,
    //     inputMint: usdtKp.publicKey,
    //     outputMint: argentumKp.publicKey,
    //     onlyCalculate: true
    // });

    // logMassive("Execution price:", executionPrice)


    // move price

    // get price
}

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");


const main3 = async () => {
    // const fromAirDropSignature = await connection.requestAirdrop(
    //     new PublicKey(trader.publicKey),
    //     5 * LAMPORTS_PER_SOL
    // );
    // const tx = await connection.confirmTransaction(fromAirDropSignature);
    // console.log(tx);

    // // console.log(bs58.encode(Keypair.generate().secretKey));
    // return;


    console.log(payer.publicKey);
    // await createClmmPool({
    //     mint1Pk: "BeApmpaPVb1xR1PvzytQKWmHUxjLuPh9V3bfdN8i81o",
    //     mint2Pk: "GFAPW2zFJuovuZ94iXAAtsPPZGUfUVwmL8ond5FEB81K",
    //     owner: payer,
    //     initialPrice: 10
    // });
}

const main2 = async () => {
    const mintAuthority = payer
    //  Keypair.fromSecretKey(bs58.decode("4R4HDkZk15CwjJPpnmTHhCBU3BJfNZrkzPVyc1gxqfFxrCnPg5vKn2fjtfRQCamozyMSs7Njpur6NueYXGwt4nBm"));
    console.log(`Mint auth: ${mintAuthority.publicKey.toBase58()}`);
    const transferFeeConfigAuthority = payer;
    //  Keypair.fromSecretKey(bs58.decode("2tgTDQgfDwX9eFCx5Z45QNUBk96ttWHwTSmZjtyzwNa4DfZP82xD86HNmcfpoDPU9TCfSfLeuzJGsFGzX3xzvRXM"));
    console.log(`Transfer fee auth: ${transferFeeConfigAuthority.publicKey.toBase58()}`);
    const withdrawWithheldAuthority = payer;
    // Keypair.fromSecretKey(bs58.decode("4EA1PXskBaQzbbxSqBCsrSYsLoznvHGLi6UjTVySViRKxm5GfWzofxGcG4EXN1psjqqiG6TJUMzRLu97WDwcaXWP"));
    console.log(`Withdraw auth: ${withdrawWithheldAuthority.publicKey.toBase58()}`);

    const mintKeypair = Keypair.generate();
    console.log();
    console.log(`Mint: ${mintKeypair.publicKey.toBase58()}`);
    console.log();


    // create mint
    const tokenParams: TokenParams = {
        decimals: 9,
        feeBasisPoints: 50,
        maxFee: BigInt(5_000)
    };

    const metaData: TokenMetadata = {
        mint: mintKeypair.publicKey,
        updateAuthority: payer.publicKey,
        name: 'Serj',
        symbol: "SRJ",
        uri: null,
        additionalMetadata: [["desc", "----"]],
    }

    await createNewMint({
        payer,
        mintAuthority,
        mintKeypair,
        transferFeeConfigAuthority,
        withdrawWithheldAuthority,
        tokenParams,
        metaData,
        deployWithFee: false
    });


    // mint token to account
    // const tokensOwner = Keypair.fromSecretKey(bs58.decode("5PKxr1dmZGn5vVsZDQKzhUZVWk3uwPRrarDbSJ8NDiWAxXuYt1dRZo9fKo1BHVDEBJyG1mUiKCFh9MtLK9Y5Z76G"));
    const sourceAccount = await createTokenAccount({
        payer,
        mint: mintKeypair.publicKey,
        owner: payer
    });

    console.log();
    console.log('-------------');
    console.log();
    // console.log(`Source account owner: ${tokensOwner.publicKey.toBase58()}`);
    console.log(`Source account: ${sourceAccount.toBase58()}`);
    console.log();
    console.log('-------------');
    console.log();

    await mintTokens({
        payer,
        mint: mintKeypair.publicKey,
        mintAuthority,
        destinationsAccount: sourceAccount,
        amount: 10
    });



};

const main = async () => {


    // // await createPool({});
    // return;

    const mintAuthority = payer
    // Keypair.fromSecretKey(bs58.decode("4R4HDkZk15CwjJPpnmTHhCBU3BJfNZrkzPVyc1gxqfFxrCnPg5vKn2fjtfRQCamozyMSs7Njpur6NueYXGwt4nBm"));
    console.log(`Mint auth: ${mintAuthority.publicKey.toBase58()}`);
    const transferFeeConfigAuthority = payer
    //  Keypair.fromSecretKey(bs58.decode("2tgTDQgfDwX9eFCx5Z45QNUBk96ttWHwTSmZjtyzwNa4DfZP82xD86HNmcfpoDPU9TCfSfLeuzJGsFGzX3xzvRXM"));
    console.log(`Transfer fee auth: ${transferFeeConfigAuthority.publicKey.toBase58()}`);
    const withdrawWithheldAuthority = payer
    // Keypair.fromSecretKey(bs58.decode("4EA1PXskBaQzbbxSqBCsrSYsLoznvHGLi6UjTVySViRKxm5GfWzofxGcG4EXN1psjqqiG6TJUMzRLu97WDwcaXWP"));
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

    const metaData: TokenMetadata = {
        mint: mintKeypair.publicKey,
        updateAuthority: payer.publicKey,
        name: 'Julia',
        symbol: "JUL",
        uri: null,
        additionalMetadata: [["description", "Only Possible On Solana"]],
    }

    await createNewMint({
        payer,
        mintAuthority,
        mintKeypair,
        transferFeeConfigAuthority,
        withdrawWithheldAuthority,
        tokenParams,
        metaData,
        deployWithFee: true
    });

    // mint token to account
    const tokensOwner = payer
    //  Keypair.fromSecretKey(bs58.decode("5PKxr1dmZGn5vVsZDQKzhUZVWk3uwPRrarDbSJ8NDiWAxXuYt1dRZo9fKo1BHVDEBJyG1mUiKCFh9MtLK9Y5Z76G"));
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
        destinationsAccount: sourceAccount,
        amount: 10
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

main4();
// main2();
// main();

// createClmmPool()