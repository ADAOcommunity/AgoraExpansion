import { Assets } from 'lucid-cardano';
import {GovernanceTokenLocker, GovernanceTokenMinter} from '../plutus'

type ConfigParameter = { action: "Sum" | "Multiply"; powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { PolicyId: { policy: string; }; } | { AssetClass: { policy: string; asset: string; }; } | { ...; }; }; } | { ...; }; }[]; }

export const getLocker = async (param: ConfigParameter) => {
    return new GovernanceTokenLocker(param)
}

export const getMinter = async (param: ConfigParameter) => {
    return new GovernanceTokenMinter(param)
}

export const getVotingPower = (assetsToLock: Assets, config: ConfigParameter) => {

}

// TODO - Write a function which allows you to lock tokens.
export const lockTokens = async (assetsToLock: Assets, config: ConfigParameter) => {
}

// TODO - Write a function which allows you to unlock tokens by burning voting-power and a receipt.
export const retrieveTokens = async (receipt: string) => {

}

// TODO - Also need to write an emulator test which demonstrates the functionality of the system.