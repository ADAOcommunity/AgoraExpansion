import {
    Blockfrost,
    C,
    Emulator,
    Credential,
    fromHex,
    fromText,
    generatePrivateKey,
    generateSeedPhrase,
    getAddressDetails,
    Lucid,
    PoolParams,
    ScriptHash,
    toUnit,
    toHex,
    TxComplete,
    TxHash,
    Data,
} from "lucid-cardano";
import { lockTokens, retrieveTokens } from './index.js'
import { GovernanceTokenLocker, GovernanceTokenMinter } from '../plutus.js'

export const testAll = async () => {  
    try {
        console.log("generating keys")
        const privateSeed0 = "strong pottery wedding fatigue hold deputy dose original thing social negative amazing gap appear sea item defense skirt issue solution laptop token august height"
        const privateSeed2 = generateSeedPhrase()
  
        console.log("generating addresses")
        const address0 = await (await Lucid.new(undefined, "Custom"))
            .selectWalletFromSeed(privateSeed0).wallet.address();
        const address2 = await (await Lucid.new(undefined, "Custom"))
            .selectWalletFromSeed(privateSeed2).wallet.address();

        let lucid = (await Lucid.new(undefined, "Custom"))
  
        const { paymentCredential } = getAddressDetails(address0);
  
        console.log("Emulator being created.")
        const emulator = new Emulator(
            [
                { address: address0, assets: { ['lovelace']: BigInt(500000000000000) } }
            ]
        );

        console.log("Establishing lucid with emulator")
        lucid = await Lucid.new(emulator);
        lucid.selectWalletFromSeed(privateSeed0);
        console.log(await lucid.wallet.address())

        emulator.awaitBlock(1)

        let ns = lucid.utils.nativeScriptFromJson({
            keyHash: paymentCredential!.hash,
            type: "sig"
        })
        const feePkh = paymentCredential!.hash

        let pol = lucid.utils.mintingPolicyToId(ns)

        console.log("Creating NFT")
        const nftMint = await (await (await lucid.newTx()
                        .attachMintingPolicy(ns)
                        .mintAssets({[pol]: BigInt(1)})
                        .payToAddress(address0, { [pol]: BigInt(1) })
                        .complete()).sign().complete()).submit();
        console.log("nftMint", nftMint)

        emulator.awaitBlock(1)
        console.log("NFT created, minting policy attached.")

        const mintGov = await (await (await lockTokens(lucid, { [pol]: BigInt(1) }, "Sum", [{ weight: BigInt(1), assetConfig: { AssetSelection: { assetSelection: { policy: pol, asset: "", c: "A"} } } }])).sign().complete()).submit()
        emulator.awaitBlock(1)
        console.log("mintGov", mintGov)

        console.log(await lucid.wallet.getUtxos())

        console.log("We successfully minted the governance tokens using our NFT using our smart contracts.")

        // const burnGov = await (await (
        const burnGo = await retrieveTokens(lucid, "0aeec336fd4be121e8d7021fd5f168154a358e6395399e499b339d02304d474d5a2323909174a6b63368bb49bc0277d4cd0f6651b83565dcc6bea557", "Sum", [{ weight: BigInt(1), assetConfig: { AssetSelection: { assetSelection: { policy: pol, asset: "", c: "A"} } } }])
        // ).sign().complete()).submit()
        console.log("burnGov", burnGo.txComplete)
        const burnGov = await (await burnGo.sign().complete()).submit()
        emulator.awaitBlock(1)
        console.log("burnGov", burnGov)

        console.log(await lucid.wallet.getUtxos())

        console.log("We successfully burned the governance tokens using our NFT using our smart contracts, allowing us to retrieve our locked tokens.")
    } catch (e) {
        console.log("error", e)
    }
}

await testAll()