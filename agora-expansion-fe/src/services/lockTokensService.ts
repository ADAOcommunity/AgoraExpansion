// Service file for lockTokens functionality
// This file contains the lockTokens function and dependencies copied from agora-expansion
// to avoid import path issues with webpack
import { Assets, C, Data, fromHex, Lucid, toHex, UTxO } from 'lucid-cardano';
import pkg from 'blakejs';
// Import plutus contracts from local src directory
import { GovernanceTokenLocker, GovernanceTokenMinter } from '../plutus.js';

const { blake2bHex } = pkg;

type AssetConfig = { policy: string, asset?: string, c: "P" | "A" }

const votingPowerName = "766f74696e675f706f776572"

const getReceiptName = (serializedOut: string) => {
    const data = serializedOut
    console.log('input data', data)
    // Convert hex string to Uint8Array (browser-compatible)
    const hex = data.startsWith('0x') ? data.slice(2) : data;
    const input = new Uint8Array(
        hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    return blake2bHex(input, undefined, 32);
}

// Coin Selection Functions
const subAssetsFromUtxos = (utxos: UTxO[], value: Assets): Assets => {
    let utxoVal: Assets = {};
    let valKs = Object.keys(value)
    utxos.forEach((u) => {
        let assets: Assets = u.assets;
        let ks = Object.keys(assets)
        ks.forEach((k) => {
            let kVal = assets[k]
            kVal = kVal !== undefined ? kVal : BigInt(0);
            let uVal = utxoVal[k];
            uVal = uVal !== undefined ? uVal : BigInt(0);
            utxoVal[k] = BigInt(kVal.toString()) + BigInt(uVal.toString())
        });
    });
    valKs.forEach((k) => {
        let kVal = value[k]
        kVal = kVal !== undefined ? kVal : BigInt(0);
        let uVal = utxoVal[k]
        uVal = uVal !== undefined ? uVal : BigInt(0);
        utxoVal[k] = BigInt(uVal.toString()) - BigInt(kVal.toString())
    })
    return utxoVal;
}

const sortByOutRef = (outputReferences: UTxO[]): UTxO[] => {
    return outputReferences.sort((a, b) => {
      if (a.txHash < b.txHash) return -1;
      if (a.txHash > b.txHash) return 1;
      return a.outputIndex - b.outputIndex;
    });
}

const sortUTxOs = (utxos: UTxO[]) => {
    return utxos.sort((a, b) => {
      if (BigInt(a.assets['lovelace']) < BigInt(b.assets['lovelace'])) return -1;
      if (BigInt(a.assets['lovelace']) > BigInt(b.assets['lovelace'])) return 1;
      return 0
    });
}

const ensureAllPositiveAssets = (assets: Assets) => {
    const keys = Object.keys(assets)
    let allPositive = true
    keys.forEach((k) => {
      const condition = BigInt(assets[k]) < BigInt(0)
      if (condition) {
        allPositive = false
      }
    })
    return allPositive
}

// Calculate minADA required for a UTxO based on the number of assets it contains
// This is a simplified calculation based on Cardano's minUTxO formula
const calculateMinAda = (numAssets: number, numPolicies: number): bigint => {
    // Base minADA (for a simple ADA-only UTxO)
    const baseMinAda = BigInt(1000000); // 1 ADA
    // Additional ADA per policy ID (28 bytes each)
    const perPolicy = BigInt(28 * 4310); // ~120,680 lovelace per policy
    // Additional ADA per asset name (average)
    const perAsset = BigInt(32 * 4310); // ~137,920 lovelace per asset
    
    return baseMinAda + (perPolicy * BigInt(numPolicies)) + (perAsset * BigInt(numAssets));
}

// Count unique policies and total assets in an Assets object
const countAssetsAndPolicies = (assets: Assets): { numAssets: number; numPolicies: number } => {
    const policies = new Set<string>();
    let numAssets = 0;
    
    for (const unit in assets) {
        if (unit === 'lovelace') continue;
        // Policy ID is first 56 characters
        const policyId = unit.slice(0, 56);
        policies.add(policyId);
        numAssets++;
    }
    
    return { numAssets, numPolicies: policies.size };
}

const naiveCoinSelection = (availableUtxos: UTxO[], requiredAssets: Assets) => {
    // Start with a base fee buffer
    const baseFeeBuffer = BigInt(500000); // 0.5 ADA for transaction fee
    
    const sortedByVal = sortUTxOs(availableUtxos)
    const selectedUtxos: UTxO[] = []
    
    for (let i = 0; i < sortedByVal.length; i++) {
        selectedUtxos.push(sortedByVal[i])
        
        // Calculate what the change output would look like
        const changeAssets = subAssetsFromUtxos(selectedUtxos, requiredAssets)
        
        // Count assets in the potential change output
        const { numAssets, numPolicies } = countAssetsAndPolicies(changeAssets);
        
        // Calculate minADA needed for the change output
        const changeMinAda = calculateMinAda(numAssets, numPolicies);
        
        // Total ADA needed: required + fee buffer + change minADA
        const totalAdaNeeded = (requiredAssets['lovelace'] || BigInt(0)) + baseFeeBuffer + changeMinAda;
        
        // Check if we have enough ADA for everything
        const totalSelectedAda = selectedUtxos.reduce((sum, u) => sum + BigInt(u.assets['lovelace'] || 0), BigInt(0));
        const adaLeftover = totalSelectedAda - totalAdaNeeded;
        
        // Check if all non-ADA assets are covered AND we have enough ADA
        const nonAdaAssetsCovered = ensureAllPositiveAssets(
            Object.fromEntries(Object.entries(changeAssets).filter(([k]) => k !== 'lovelace'))
        );
        
        if (nonAdaAssetsCovered && adaLeftover >= changeMinAda) {
            return selectedUtxos;
        }
    }
    
    // Final check
    const changeAssets = subAssetsFromUtxos(selectedUtxos, requiredAssets)
    const { numAssets, numPolicies } = countAssetsAndPolicies(changeAssets);
    const changeMinAda = calculateMinAda(numAssets, numPolicies);
    const totalAdaNeeded = (requiredAssets['lovelace'] || BigInt(0)) + baseFeeBuffer + changeMinAda;
    const totalSelectedAda = selectedUtxos.reduce((sum, u) => sum + BigInt(u.assets['lovelace'] || 0), BigInt(0));
    
    if (totalSelectedAda >= totalAdaNeeded && ensureAllPositiveAssets(
        Object.fromEntries(Object.entries(changeAssets).filter(([k]) => k !== 'lovelace'))
    )) {
        return selectedUtxos;
    }
    
    throw new Error("Coin Selection Failed: Not enough ADA to cover minADA for change output.")
}

const getLocker = async (
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { PolicySelection: { policy: string; }; } | { AssetClass: { policy: string; asset: string; }; }}}}[]
) => {
    return GovernanceTokenLocker({action, powerList})
}

const getMinter = async (
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { PolicySelection: { policy: string; }; } | { AssetClass: { policy: string; asset: string; }; }}}}[]
) => {
    return GovernanceTokenMinter({action, powerList})
}

const getPowerForSingleConfig = async (
    assets: Assets,
    assetConfig: AssetConfig,
    weight: bigint
) => {
    console.log('getPowerForSingleConfig called with:', {
        assets,
        assetConfig,
        weight: weight.toString()
    })
    let counter = BigInt(0)
    if (assetConfig.c === "P") {
        // Special case for ADA (lovelace) - empty policy means we're looking for lovelace
        if (assetConfig.policy === '') {
            const lovelaceAmount = assets['lovelace']
            console.log('ADA case (PolicySelection), lovelaceAmount:', lovelaceAmount?.toString())
            if (lovelaceAmount !== undefined) {
                return lovelaceAmount * weight
            }
            return BigInt(0)
        }
        // For other policies, match by policy ID prefix
        for (const unit in assets) {
            if (unit.slice(0, 56) === assetConfig.policy) {
                counter = counter + assets[unit]
            }
        }
        return counter * weight
    } else {
        // For AssetClass type
        // Special case for ADA (empty policy and empty/undefined asset)
        if (assetConfig.policy === '' && (!assetConfig.asset || assetConfig.asset === '')) {
            const lovelaceAmount = assets['lovelace']
            console.log('ADA case (AssetClass), lovelaceAmount:', lovelaceAmount?.toString())
            if (lovelaceAmount !== undefined) {
                return lovelaceAmount * weight
            }
            return BigInt(0)
        }
        const amount = assets[assetConfig.policy + assetConfig.asset!]
        // amount is already BigInt, weight is bigint, so just multiply directly
        if (amount === undefined) {
            return BigInt(0)
        }
        return amount * weight
    }
}

export const getVotingPower = async (
    assetsToLock: Assets,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig } } }[]
) => {
    console.log('getVotingPower called with:', {
        assetsToLock,
        action,
        powerListLength: powerList.length
    })
    let startingPower = BigInt(0)
    for (let i = 0; i < powerList.length; i++) {
        const assetConfig = powerList[i].assetConfig.AssetSelection.assetSelection
        const weight = powerList[i].weight
        console.log(`powerList[${i}]:`, { assetConfig, weight: weight.toString() })
        const powerValue = await getPowerForSingleConfig(assetsToLock, assetConfig, weight)
        console.log(`powerValue for item ${i}:`, powerValue.toString())
        if (action === "Sum") {
            startingPower += powerValue
        } else {
            startingPower = startingPower * powerValue
        }
    }
    console.log('Final voting power:', startingPower.toString())
    return startingPower
}

const convertPowerListToConfig = (powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig } } }[]) => {
    const config = powerList.map((power) => {
        if (power.assetConfig.AssetSelection.assetSelection.c === "P") {
            return {
                weight: power.weight,
                assetConfig: { AssetSelection: { assetSelection: { PolicySelection: { policy: power.assetConfig.AssetSelection.assetSelection.policy }}}}
            }
        } else {
            return {
                weight: power.weight,
                assetConfig: { AssetSelection: { assetSelection: { AssetClass: { policy: power.assetConfig.AssetSelection.assetSelection.policy, asset: power.assetConfig.AssetSelection.assetSelection.asset! }}}}
            }
        }
    })
    return config
}

// Get the minter policy ID for a given config (useful for finding receipt NFTs)
export const getMinterPolicyId = async (
    lucid: Lucid,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig }}}[]
): Promise<string> => {
    const convertedPowerList = convertPowerListToConfig(powerList)
    const minter = await getMinter(action, convertedPowerList)
    return lucid.utils.mintingPolicyToId(minter as any)
}

// Get the locker address for a given config
export const getLockerAddress = async (
    lucid: Lucid,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig }}}[]
): Promise<string> => {
    const convertedPowerList = convertPowerListToConfig(powerList)
    const locker = await getLocker(action, convertedPowerList)
    return lucid.utils.validatorToAddress(locker as any)
}

export const lockTokens = async (
    lucid: Lucid,
    assetsToLock: Assets,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig }}}[],
) => {
    const convertedPowerList = convertPowerListToConfig(powerList)
    const minter = await getMinter(action, convertedPowerList)
    const policy = lucid.utils.mintingPolicyToId(minter as any)
    const locker = await getLocker(action, convertedPowerList)
    const votingPower = await getVotingPower(assetsToLock, action, powerList)
    const sentAssets = assetsToLock

    const lockerAddress = await lucid.utils.validatorToAddress(locker as any)
    const userUtxos = await lucid.wallet.getUtxos()
    const collectedUtxos = sortByOutRef(naiveCoinSelection(userUtxos, assetsToLock))
    const l = C.PlutusList.new()
    const li = C.PlutusList.new()
    li.add(C.PlutusData.new_bytes(fromHex(collectedUtxos[0].txHash)))
    l.add(C.PlutusData.new_constr_plutus_data(C.ConstrPlutusData.new(C.BigNum.from_str("0"), li)))
    l.add(C.PlutusData.new_integer(C.BigInt.from_str(collectedUtxos[0].outputIndex.toString())))
    const constr = C.PlutusData.new_constr_plutus_data(C.ConstrPlutusData.new(C.BigNum.from_str("0"), l)).to_bytes()
    const receiptName = getReceiptName(toHex(constr))
    sentAssets[policy + receiptName] = 1n

    const tx = lucid.newTx()
            .collectFrom(collectedUtxos)
            .payToContract(lockerAddress, {inline: Data.to({ bondName: receiptName, votingPower: votingPower}, GovernanceTokenLocker.datum as any)}, sentAssets)
            .attachMintingPolicy(minter as any)
            .mintAssets({[policy + votingPowerName]: votingPower, [policy + receiptName]: 2n}, Data.to("Lock", GovernanceTokenMinter.redeemer as any))
    console.log("TX: ", await tx.toString())
    const txC = await tx.complete({coinSelection: false})
    return txC
}

export const retrieveTokens = async (
    lucid: Lucid,
    receipt: string, // Full unit: policyId + assetName
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig }}}[]
) => {
    console.log("Retrieving tokens for receipt:", receipt)
    const convertedPowerList = convertPowerListToConfig(powerList)
    const minter = await getMinter(action, convertedPowerList)
    const policy = lucid.utils.mintingPolicyToId(minter as any)
    const locker = await getLocker(action, convertedPowerList)
    const lockerAddress = lucid.utils.validatorToAddress(locker as any)
    
    console.log("Locker address:", lockerAddress)
    console.log("Looking for UTxOs with receipt:", receipt)
    
    // Find the UTxO at the locker address that contains the receipt NFT
    const lockedUtxos = await lucid.utxosAtWithUnit(lockerAddress, receipt)
    
    if (lockedUtxos.length === 0) {
        throw new Error("No locked UTxO found with this receipt NFT")
    }
    
    const lockedUtxo = lockedUtxos[0]
    console.log("Found locked UTxO:", lockedUtxo)
    
    // Parse the datum to get voting power
    const datum = Data.from(lockedUtxo.datum!, GovernanceTokenLocker.datum as any) as { bondName: string; votingPower: bigint }
    console.log("Datum:", datum)
    
    // Verify the receipt matches
    if (policy + datum.bondName !== receipt) {
        console.warn("Receipt mismatch - this could be an issue")
    }
    
    console.log("Building tx for burning")
    const tx = lucid.newTx()
            .collectFrom([lockedUtxo], Data.to({wrapper: ""}, GovernanceTokenLocker._redeemer as any))
            .mintAssets({[receipt]: -2n, [policy + votingPowerName]: -datum.votingPower}, Data.to("Unlock", GovernanceTokenMinter.redeemer as any))
            .attachSpendingValidator(locker as any)
            .attachMintingPolicy(minter as any)
    
    console.log("TX: ", await tx.toString())
    const txC = await tx.complete()
    return txC
}
