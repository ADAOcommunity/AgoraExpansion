import { Assets } from 'lucid-cardano';
import {GovernanceTokenLocker, GovernanceTokenMinter} from '../plutus'

type ConfigParameter = { action: "Sum" | "Multiply"; powerList: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { PolicyId: { policy: string; }; } | { AssetClass: { policy: string; asset: string; }; } | { ...; }; }; } | { ...; }; }[]; }
// We have to finish writing the parameter bullshit.


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

// Today we need to address the remaining code on this, we should be able to complete it before dinner time and in that case we could spend a lot of time tomorrow on other things.

// If we cannot finish this today it will bleed into this coming week which is not great. I think it would be optimal to finish it today, I want to drink some water, I want to eat some food, but I can eat food later, I can drink water now. I can take a break in roughly 105 minutes.