interface UTxO {
  txHash: string;
  outputIndex: number;
  assets: { [unit: string]: string };
  address: string;
  datumHash?: string;
}

interface CardanoAPI {
  enable: () => Promise<any>;
  getNetworkId: () => Promise<number>;
  getUtxos: (amount?: string, paginate?: { page: number; limit: number }) => Promise<UTxO[] | undefined>;
  getBalance: () => Promise<string>;
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  getRewardAddresses: () => Promise<string[]>;
  signTx: (tx: string, partialSign?: boolean) => Promise<string>;
  signData: (addr: string, payload: string) => Promise<{ signature: string; key: string }>;
  submitTx: (tx: string) => Promise<string>;
}

interface Cardano {
  eternl?: CardanoAPI;
  lace?: CardanoAPI;
  yoroi?: CardanoAPI;
  nami?: CardanoAPI;
}

declare global {
  interface Window {
    cardano?: Cardano;
  }
}

export {}; 