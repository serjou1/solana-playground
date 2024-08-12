import { Connection, Keypair } from "@solana/web3.js";
import { TokenMetadataPartial } from "../types";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export const createTokenWithTransferFee = async (params: {
    tokenData: TokenMetadataPartial,
    payeer: Keypair,
    transferFeeAuthority: Keypair,
    withdrawWitheldAutrority: Keypair
}) => {
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;


};