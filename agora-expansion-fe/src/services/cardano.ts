import { Assets } from 'lucid-cardano';
import { Lucid } from 'lucid-cardano';
import type { CardanoAPI } from '../types/window';
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

  private getAvailableWallet(
    preferredWallets: Array<'lace' | 'eternl' | 'nami' | 'yoroi'>
  ): { name: 'lace' | 'eternl' | 'nami' | 'yoroi'; api: CardanoAPI } {
    if (typeof window === 'undefined' || !window.cardano) {
      throw new Error('Cardano wallets not detected');
    }

    for (const name of preferredWallets) {
      const api = window.cardano[name];
      if (api) {
        return { name, api };
      }
    }

    throw new Error('No supported Cardano wallets found');
  }

  async initialize() {
    if (typeof window.cardano === 'undefined') {
      throw new Error('Cardano wallet not found! Please install a wallet.');
    }
    
    // Initialize Lucid - you'll need to set this up based on your network
    // this.lucid = await Lucid.new(...)
  }

  async connectWallet(walletName?: 'lace' | 'eternl' | 'nami' | 'yoroi') {
    if (!this.lucid) {
      throw new Error('Cardano service not initialized');
    }

    const { api } = this.getAvailableWallet(
      walletName ? [walletName] : ['lace', 'eternl', 'nami', 'yoroi']
    );
    const enabledApi = await api.enable();
    this.lucid.selectWallet(enabledApi);
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
