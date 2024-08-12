export type TokenMetadataPartial = {
    name: string,
    symbol: string,
    uri: string,
    additionalMetadata: string[][]
};

export type TokenParams = {
    decimals: number,
    feeBasisPoints: number,
    maxFee: bigint
};