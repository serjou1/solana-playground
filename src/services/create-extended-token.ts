import {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,

    Account,
    SystemProgram,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
    TOKEN_PROGRAM_ID,
    createMint,
    getMint,
    getOrCreateAssociatedTokenAccount,
    getAccount,
    mintTo,
    AccountLayout,
    createInitializeTransferFeeConfigInstruction,

} from '@solana/spl-token';

import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    // getMint,
    getMetadataPointerState,
    getTokenMetadata,
    TYPE_SIZE,
    LENGTH_SIZE,
} from "@solana/spl-token";
import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    createRemoveKeyInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";

// import { DataV2, createCreateMetadataAccountV2Instruction } from '@metaplex-foundation/mpl-token-metadata';
// import { findMetadataPda } from '@metaplex-foundation/js';


// import { createMint } from '@solana/spl-token';
// import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const createExtendedToken = async () => {
    // const wallet = new Keypair();

    // const keypair = Keypair.generate();
    // console.log(`public key: ${keypair.publicKey.toBase58()}`);
    // console.log(`private key(raw): ${keypair.secretKey}`);
    // console.log(`private key(bs58): ${bs58.encode(keypair.secretKey)}`);

    // console.log(wallet.secretKey.toString())
    // // console.log(new PublicKey(wallet.publicKey).toString());

    // console.log(new PublicKey(wallet.publicKey).toString());


    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    const payer = Keypair.fromSecretKey(bs58.decode("2x8h7ZPWGWRoWiQwJNgTziNS4hpzzmUMUJKvsnZohYfzY8cCtwWfqjvRrG3vdcwi48GMTHyYKmxFVXf4AaETWhSm"))

    // Generate new keypair for Mint Account
    const mintKeypair = Keypair.generate();
    // Address for Mint Account
    const mint = mintKeypair.publicKey;
    // Decimals for Mint Account
    const decimals = 2;
    // Authority that can mint new tokens
    const mintAuthority = payer.publicKey;
    // Authority that can update the metadata pointer and token metadata
    const updateAuthority = payer.publicKey;

    // Metadata to store in Mint Account
    const metaData: TokenMetadata = {
        updateAuthority: updateAuthority,
        mint: mint,
        name: "Zalupa strekozy",
        symbol: "ZAST",
        uri: null,// "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
        additionalMetadata: [["description", "Only Possible On Solana"]],
    };


    // Size of MetadataExtension 2 bytes for type, 2 bytes for length
    const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
    // Size of metadata
    const metadataLen = pack(metaData).length;

    // Size of Mint Account with extension
    const mintLen = getMintLen([
        ExtensionType.MetadataPointer,
        ExtensionType.TransferFeeAmount
    ]);

    // Minimum lamports required for Mint Account
    const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataExtension + metadataLen,
    );

    // Instruction to invoke System Program to create new account
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey, // Account that will transfer lamports to created account
        newAccountPubkey: mint, // Address of the account to create
        space: mintLen, // Amount of bytes to allocate to the created account
        lamports, // Amount of lamports transferred to created account
        programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
    });


    const initializeMetadataPointerInstruction =
        createInitializeMetadataPointerInstruction(
            mint, // Mint Account address
            updateAuthority, // Authority that can set the metadata address
            mint, // Account address that holds the metadata
            TOKEN_2022_PROGRAM_ID,
        );

    const transferFeeConfigAuthority = Keypair.generate();
    const withdrawWithheldAuthority = Keypair.generate();

    const feeBasisPoints = 50;
    const maxFee = BigInt(5_000);

    const initializeTransferFeeConfigInstruction =
        createInitializeTransferFeeConfigInstruction(
            mint,
            transferFeeConfigAuthority.publicKey,
            withdrawWithheldAuthority.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID,
        )

    // Instruction to initialize Mint Account data
    const initializeMintInstruction = createInitializeMintInstruction(
        mint, // Mint Account Address
        decimals, // Decimals of Mint
        mintAuthority, // Designated Mint Authority
        null, // Optional Freeze Authority
        TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
    );

    // Instruction to initialize Metadata Account data
    const initializeMetadataInstruction = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
        metadata: mint, // Account address that holds the metadata
        updateAuthority: updateAuthority, // Authority that can update the metadata
        mint: mint, // Mint Account address
        mintAuthority: mintAuthority, // Designated Mint Authority
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
    });

    // Instruction to update metadata, adding custom field
    const updateFieldInstruction = createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
        metadata: mint, // Account address that holds the metadata
        updateAuthority: updateAuthority, // Authority that can update the metadata
        field: metaData.additionalMetadata[0][0], // key
        value: metaData.additionalMetadata[0][1], // value
    });

    // Add instructions to new transaction
    const transaction = new Transaction().add(
        createAccountInstruction,
        initializeMetadataPointerInstruction,
        // note: the above instructions are required before initializing the mint
        initializeTransferFeeConfigInstruction,
        initializeMintInstruction,
        initializeMetadataInstruction,
        updateFieldInstruction,
    );

    // Send transaction
    const transactionSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintKeypair], // Signers
    );

    console.log(
        "\nCreate Mint Account:",
        `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
    );


    // Retrieve mint information
    const mintInfo = await getMint(
        connection,
        mint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID,
    );

    // Retrieve and log the metadata pointer state
    const metadataPointer = getMetadataPointerState(mintInfo);
    console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));



    // Retrieve and log the metadata state
    const metadata = await getTokenMetadata(
        connection,
        mint, // Mint Account address
    );
    console.log("\nMetadata:", JSON.stringify(metadata, null, 2));



    //     // const payer = Keypair.generate();
    //     const mintAuthority = Keypair.generate();
    //     const freezeAuthority = Keypair.generate();

    //     const connection = new Connection(
    //         clusterApiUrl('devnet'),
    //         'confirmed'
    //     );

    //     const metadataPDA = await findMetadataPda(mintAuthority.publicKey);
    //     // This is derived from the mint account's public key
    //     const tokenMetadata = {
    //         name: "Test Token",
    //         symbol: "TEST",
    //         uri: https://token-creator-lac.vercel.app/token_metadata.json,
    //         sellerFeeBasisPoints: 0,
    //         creators: null,
    //         collection: null,
    //         uses: null
    //     } as DataV2;

    //     const createNewTokenTransaction = new Transaction().add(
    //         createCreateMetadataAccountV2Instruction({
    //             metadata: metadataPDA,
    //             mint: mintPublicKey,
    //             mintAuthority: userPublicKey,
    //             payer: userPublicKey,
    //             updateAuthority: userPublicKey,
    //         },
    //             {
    //                 createMetadataAccountArgsV2:
    //                 {
    //                     data: tokenMetadata,
    //                     isMutable: true
    //                 }
    //             }
    //         )
    // await sendTransaction(createNewTokenTransaction, connection);


    //     return;

    //     const mint = await createMint(
    //         connection,
    //         payer,
    //         mintAuthority.publicKey,
    //         freezeAuthority.publicKey,
    //         9 // We are using 9 to match the CLI decimal default exactly
    //     );

    //     console.log(mint.toBase58());
    //     // AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC9wajM

    //     const mintInfo = await getMint(
    //         connection,
    //         mint
    //     )

    //     console.log(mintInfo.supply);

    //     const tokenAccount = await getOrCreateAssociatedTokenAccount(
    //         connection,
    //         payer,
    //         mint,
    //         payer.publicKey
    //     )

    //     console.log(tokenAccount.address.toBase58());

    //     const tokenAccountInfo = await getAccount(
    //         connection,
    //         tokenAccount.address
    //     )

    //     console.log(tokenAccountInfo.amount);

    //     await mintTo(
    //         connection,
    //         payer,
    //         mint,
    //         tokenAccount.address,
    //         mintAuthority,
    //         100000000000 // because decimals for the mint are set to 9 
    //     )

    //     const mintInfo2 = await getMint(
    //         connection,
    //         mint
    //     )

    //     console.log(mintInfo2.supply);
    //     // 100

    //     const tokenAccountInfo2 = await getAccount(
    //         connection,
    //         tokenAccount.address
    //     )

    //     console.log(tokenAccountInfo2.amount);


    //     const tokenAccounts = await connection.getTokenAccountsByOwner(
    //         new PublicKey('8LHa3GCWrWEbtbMbhJHBKSUVcUL7bTWaTTeMMkdFUaeZ'),
    //         {
    //             programId: TOKEN_PROGRAM_ID,
    //         }
    //     );

    //     console.log("Token                                         Balance");
    //     console.log("------------------------------------------------------------");
    //     tokenAccounts.value.forEach((tokenAccount) => {
    //         const accountData = AccountLayout.decode(tokenAccount.account.data);
    //         console.log(`${new PublicKey(accountData.mint)}   ${accountData.amount}`);
    //     })
    // return;

    // console.log(kp.publicKey.toBase58());

    // const mintKeypair = Keypair.generate();

    // const mint = await Token.createMint(
    //     connection,
    //     mintKeypair,
    //     mintKeypair.publicKey, // Mint authority (you)
    //     null, // Freeze authority (none)
    //     9, // Decimals
    //     TOKEN_PROGRAM_ID, // Program ID
    //     kp.publicKey // Payer (a random keypair)
    // );

    // console.log(mint);

};