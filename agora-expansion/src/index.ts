import { Assets, C, Constr, Data, fromHex, Lucid, toHex, UTxO } from 'lucid-cardano';
import { GovernanceTokenLocker, GovernanceTokenMinter } from '../plutus.js'
import pkg from 'blakejs'
const { blake2bHex } = pkg

type AssetConfig = { policy: string, asset?: string, c: "P" | "A" }

const votingPowerName = "766f74696e675f706f776572"

// Receipt Name Functions
const numberToHexString = (num: number): string => {
    const str = num.toString(); // Convert number to string
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str); // Encode string to bytes
    return Array.from(bytes, byte => byte.toString(16)).join(''); // Convert bytes to hex string
  }

const getReceiptName = (serializedOut: string) => {
    const data = serializedOut
    console.log('input data', data)
    const input = Buffer.from(data, 'hex')
    return blake2bHex(input, undefined, 32)
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
            kVal = kVal != undefined ? kVal : BigInt(0);
            let uVal = utxoVal[k];
            uVal = uVal != undefined ? uVal : BigInt(0);
            utxoVal[k] = BigInt(kVal.toString()) + BigInt(uVal.toString())
        });
    });
    valKs.forEach((k) => {
        let kVal = value[k]
        kVal = kVal != undefined ? kVal : BigInt(0);
        let uVal = utxoVal[k]
        uVal = uVal != undefined ? uVal : BigInt(0);
        //if (kVal > uVal) {
            //throw 'Subtraction Failed.';
        //}
        utxoVal[k] = BigInt(uVal.toString()) - BigInt(kVal.toString())
    })
    return utxoVal;
}

const sortByOutRef = (outputReferences: UTxO[]): UTxO[] => {
    return outputReferences.sort((a, b) => {
      // Compare the txHash first
      if (a.txHash < b.txHash) return -1;
      if (a.txHash > b.txHash) return 1;
  
      // If txHash is equal, compare the outputIndex
      return a.outputIndex - b.outputIndex;
    });
}
// We can just collect from the utxo with the first cardinal ordering from the user on mint.

const sortUTxOs = (utxos: UTxO[]) => {
    // Here we are comparing by lovelace value
    return utxos.sort((a, b) => {
      // Compare the txHash first
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
      // console.log('condition', condition, 'k', k, 'assets[k]', assets[k].toString())
      if (condition) {
        allPositive = false
      }
    })
    return allPositive
}

const naiveCoinSelection = (availableUtxos: UTxO[], requiredAssets: Assets) => {
    // We assume that there's a big fee, but lucid will return extra as change.
    requiredAssets['lovelace'] = requiredAssets['lovelace'] ? requiredAssets['lovelace'] + BigInt(3000000) : BigInt(3000000)
    // We take largest first approach, so we sort UTxOs.
    const sortedByVal = sortUTxOs(availableUtxos)
    const selectedUtxos: UTxO[] = []
    for (let i = 0; i < sortedByVal.length; i++) {
        selectedUtxos.push(sortedByVal[i])
        const assetsToCheck = subAssetsFromUtxos(selectedUtxos, requiredAssets)
        if (ensureAllPositiveAssets(assetsToCheck)) break;
    }
    const assetsToCheck = subAssetsFromUtxos(selectedUtxos, requiredAssets)
    if (ensureAllPositiveAssets(assetsToCheck)) {
        return selectedUtxos
    }
    throw "Coin Selection Failed."
}

// Contract Specific Logic
export const getLocker = async (
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { PolicySelection: { policy: string; }; } | { AssetClass: { policy: string; asset: string; }; }}}}[]
) => {
    return new GovernanceTokenLocker({action, powerList})
}

export const getMinter = async (
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { PolicySelection: { policy: string; }; } | { AssetClass: { policy: string; asset: string; }; }}}}[]
) => {
    return new GovernanceTokenMinter({action, powerList})
}

const getPowerForSingleConfig = async (
    assets: Assets,
    assetConfig: AssetConfig,
    weight: bigint
) => {
    let counter = 0n
    if (assetConfig.c === "P") {
        // assets is a record, we must iterate through
        for (const unit in assets) {
            // the first 56 characters of unit in assets is the policy id
            if (unit.slice(0, 56) === assetConfig.policy) {
                counter = counter + assets[unit]
            }
        }
        return counter * weight
    } else {
        return assets[assetConfig.policy + assetConfig.asset!] * weight
    }
}

// This function needs to be able to calculate the voting power of a given set of assets given the action and powerList
export const getVotingPower = async (
    assetsToLock: Assets,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig } } }[]
) => {
    let startingPower = BigInt(0)
    for (let i = 0; i < powerList.length; i++) {
        const assetConfig = powerList[i].assetConfig.AssetSelection.assetSelection
        const weight = powerList[i].weight
        const powerValue = await getPowerForSingleConfig(assetsToLock, assetConfig, weight)
        if (action === "Sum") {
            startingPower += powerValue
        } else {
            startingPower = startingPower * powerValue
        }
    }
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

export const lockTokens = async (
    lucid: Lucid,
    assetsToLock: Assets,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig }}}[],
) => {
    // We assume that lucid already has the appropriate wallet selected.
    const convertedPowerList = convertPowerListToConfig(powerList)
    const minter = await getMinter(action, convertedPowerList)
    const policy = lucid.utils.mintingPolicyToId(minter)
    const locker = await getLocker(action, convertedPowerList)
    const votingPower = await getVotingPower(assetsToLock, action, powerList)
    const sentAssets = assetsToLock

    const lockerAddress = await lucid.utils.validatorToAddress(locker)
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

    const tx = await lucid.newTx()
            .collectFrom(collectedUtxos)
            .payToContract(lockerAddress, {inline: Data.to({ bondName: receiptName, votingPower: votingPower}, GovernanceTokenLocker.datum)}, sentAssets)
            .attachMintingPolicy(minter)
            .mintAssets({[policy + votingPowerName]: votingPower, [policy + receiptName]: 2n}, Data.to("Lock", GovernanceTokenMinter.redeemer))
            .complete({coinSelection: false})
    return tx
}

export const retrieveTokens = async (
    lucid: Lucid,
    receipt: string,
    action: "Sum" | "Multiply",
    powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: AssetConfig }}}[]
) => {
    console.log("receipt", receipt)
    const convertedPowerList = convertPowerListToConfig(powerList)
    const minter = await getMinter(action, convertedPowerList)
    const policy = lucid.utils.mintingPolicyToId(minter)
    const locker = await getLocker(action, convertedPowerList)
    const lockerAddress = await lucid.utils.validatorToAddress(locker)
    console.log(await lucid.utxosAt(lockerAddress))
    const lockedUtxo = await lucid.utxosAtWithUnit(lockerAddress, receipt)

    const data = Data.from(lockedUtxo[0].datum!, GovernanceTokenLocker.datum)
    if (policy + data.bondName != receipt) {
        console.log("This could be an issue..")
    }

    console.log("Building tx for burning")
    const tx = lucid.newTx()
            .collectFrom(lockedUtxo, Data.to({wrapper: ""}, GovernanceTokenLocker._redeemer))
            .mintAssets({[receipt]: -2n, [policy + votingPowerName]: -data.votingPower}, Data.to("Unlock", GovernanceTokenMinter.redeemer))
            .attachSpendingValidator(locker)
            .attachMintingPolicy(minter)
    console.log("tx", await tx.toString())
    const txC = await tx.complete()
    return txC
}