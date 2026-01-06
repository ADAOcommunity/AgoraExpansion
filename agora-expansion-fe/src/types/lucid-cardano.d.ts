declare module "lucid-cardano" {
  export type Network = "Mainnet" | "Testnet" | string;
  export type Assets = Record<string, bigint>;
  export type UTxO = {
    txHash: string;
    outputIndex: number;
    assets: Record<string, bigint>;
    address?: string;
    datumHash?: string;
    datum?: string;
  };

  export const Lucid: any;
  export type Lucid = any;
  export const Blockfrost: any;
  export const C: any;
  export const Data: any;
  export const applyParamsToScript: (...args: any[]) => any;
  export const fromHex: (hex: string) => Uint8Array;
  export const toHex: (bytes: Uint8Array) => string;
}

declare global {
  interface Window {
    cardano?: Record<
      string,
      {
        name: string;
        icon: string;
        apiVersion: string;
        enable: () => Promise<any>;
        isEnabled: () => Promise<boolean>;
      }
    >;
  }
}

export {};
