import { Assets } from 'lucid-cardano';
import { Lucid } from 'lucid-cardano';
import { lockTokens as lockTokensRaw, retrieveTokens as retrieveTokensRaw } from '../../../agora-expansion/src/index';

export type AssetConfig = { policy: string, asset?: string, c: "P" | "A" }

export interface PowerListItem {
  weight: bigint;
  assetConfig: {
    AssetSelection: {
      assetSelection: AssetConfig;
    };
  };
}

const lockTokens = lockTokensRaw as unknown as (
  lucid: Lucid,
  assetsToLock: Assets,
  action: "Sum" | "Multiply",
  powerList: PowerListItem[]
) => ReturnType<typeof lockTokensRaw>;

const retrieveTokens = retrieveTokensRaw as unknown as (
  lucid: Lucid,
  receipt: string,
  action: "Sum" | "Multiply",
  powerList: PowerListItem[]
) => ReturnType<typeof retrieveTokensRaw>;

export class CardanoService {
  private lucid: Lucid | null = null;

  async initialize() {
    if (typeof window.cardano === 'undefined') {
      throw new Error('Cardano wallet not found! Please install a wallet.');
    }
    
    // Initialize Lucid - you'll need to set this up based on your network
    // this.lucid = await Lucid.new(...)
  }

  async connectWallet() {
    if (!this.lucid) {
      throw new Error('Cardano service not initialized');
    }

    const api = await window.cardano.nami.enable();
    this.lucid.selectWallet(api);
  }

  async lockTokens(
    assetsToLock: Assets,
    action: "Sum" | "Multiply",
    powerList: PowerListItem[]
  ) {
    if (!this.lucid) {
      throw new Error('Cardano service not initialized');
    }

    const tx = await lockTokens(this.lucid, assetsToLock, action, powerList);
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    return txHash;
  }

  async retrieveTokens(
    receipt: string,
    action: "Sum" | "Multiply",
    powerList: PowerListItem[]
  ) {
    if (!this.lucid) {
      throw new Error('Cardano service not initialized');
    }

    const tx = await retrieveTokens(this.lucid, receipt, action, powerList);
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    return txHash;
  }
}

// Create a singleton instance
export const cardanoService = new CardanoService(); 
