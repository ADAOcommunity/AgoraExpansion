import { Lucid, Blockfrost, Network, C } from 'lucid-cardano';
import { Asset } from './assetCache';

// You'll need to set your Blockfrost API keys
// For mainnet: https://cardano-mainnet.blockfrost.io/api/v0
// For testnet: https://cardano-testnet.blockfrost.io/api/v0
const BLOCKFROST_MAINNET_URL = process.env.REACT_APP_BLOCKFROST_MAINNET_URL || 'https://cardano-mainnet.blockfrost.io/api/v0';
const BLOCKFROST_MAINNET_API_KEY = process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY || 'mainnetrUAUmHUUTKXvyyWl6ksq8lRjX1iJod9D';
const BLOCKFROST_TESTNET_URL = process.env.REACT_APP_BLOCKFROST_TESTNET_URL || 'https://cardano-testnet.blockfrost.io/api/v0';
const BLOCKFROST_TESTNET_API_KEY = process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY || '';

class LucidService {
  private lucid: Lucid | null = null;
  private currentNetwork: Network | null = null;

  async initialize(network: Network = 'Mainnet'): Promise<void> {
    this.currentNetwork = network;
    
    // Select the appropriate Blockfrost URL and API key based on network
    let blockfrostUrl: string;
    let blockfrostApiKey: string;
    
    if (network === 'Mainnet') {
      blockfrostUrl = BLOCKFROST_MAINNET_URL;
      blockfrostApiKey = BLOCKFROST_MAINNET_API_KEY;
    } else {
      blockfrostUrl = BLOCKFROST_TESTNET_URL;
      blockfrostApiKey = BLOCKFROST_TESTNET_API_KEY;
    }

    if (!blockfrostApiKey) {
      throw new Error(`Blockfrost API key not configured for ${network}. Please set REACT_APP_BLOCKFROST_${network.toUpperCase()}_API_KEY environment variable.`);
    }

    this.lucid = await Lucid.new(
      new Blockfrost(blockfrostUrl, blockfrostApiKey),
      network
    );
  }

  // Helper to convert hex address to bech32 format
  static async hexToBech32(hexAddress: string, network: Network = 'Mainnet'): Promise<string> {
    try {
      // Initialize a temporary Lucid instance for address conversion
      const tempLucid = await Lucid.new(undefined, network);
      
      // Convert hex string to Uint8Array (browser-compatible)
      const hex = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress;
      const addressBytes = new Uint8Array(
        hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      const address = C.Address.from_bytes(addressBytes);
      // to_bech32() requires a prefix - use "addr" for mainnet, "addr_test" for testnet
      const prefix = network === 'Mainnet' ? 'addr' : 'addr_test';
      return address.to_bech32(prefix);
    } catch (error) {
      console.error('Error converting hex address to bech32:', error);
      throw new Error('Failed to convert address to bech32 format');
    }
  }

  // Helper to detect network from bech32 address
  // Mainnet addresses start with "addr1", testnet addresses start with "addr_test1"
  static getNetworkFromAddress(address: string): Network {
    if (address.startsWith('addr1')) {
      return 'Mainnet' as Network;
    } else if (address.startsWith('addr_test1')) {
      return 'Testnet' as Network;
    } else {
      // Default to Mainnet if we can't determine
      console.warn('Could not determine network from address, defaulting to Mainnet');
      return 'Mainnet' as Network;
    }
  }

  // Helper to check if address is hex format
  static isHexAddress(address: string): boolean {
    // Hex addresses are typically 114 characters (57 bytes = 114 hex chars for a full address)
    // But they can vary, so we check if it's a valid hex string and doesn't start with bech32 prefixes
    return /^[0-9a-fA-F]+$/.test(address) && 
           !address.startsWith('addr1') && 
           !address.startsWith('addr_test1') &&
           address.length >= 56; // Minimum length for a valid address
  }

  async getAssetsFromAddress(address: string): Promise<Asset[]> {
    if (!this.lucid) {
      throw new Error('Lucid not initialized. Call initialize() first.');
    }

    try {
      // Get all UTXOs at the address
      const utxos = await this.lucid.utxosAt(address);

      // Aggregate all assets
      const assetMap = new Map<string, bigint>();

      for (const utxo of utxos) {
        // UTXO.assets is an object { [unit: string]: bigint } where key is the unit
        if (utxo.assets) {
          for (const [unit, quantity] of Object.entries(utxo.assets)) {
            const currentQty = assetMap.get(unit) || BigInt(0);
            assetMap.set(unit, currentQty + (quantity as bigint));
          }
        }
      }

      // Convert to Asset array
      const assets: Asset[] = Array.from(assetMap.entries()).map(([unit, quantity]) => {
        let policyId = '';
        let assetName = '';
        let displayName = '';

        if (unit === 'lovelace') {
          displayName = 'ADA';
        } else if (unit.length === 56) {
          // Policy-only asset (no asset name)
          policyId = unit;
          displayName = `${policyId.slice(0, 8)}...`;
        } else {
          // Native asset format: policyId + assetName (both hex)
          policyId = unit.slice(0, 56); // Policy ID is 28 bytes = 56 hex chars
          assetName = unit.slice(56);
          
          // Try to decode asset name to readable string
          if (assetName.length > 0) {
            try {
              const decoded = this.hexToString(assetName);
              if (decoded && decoded.trim().length > 0) {
                displayName = decoded;
              } else {
                displayName = `${policyId.slice(0, 8)}...${assetName.slice(0, 8)}`;
              }
            } catch {
              displayName = `${policyId.slice(0, 8)}...${assetName.slice(0, 8)}`;
            }
          } else {
            displayName = `${policyId.slice(0, 8)}...`;
          }
        }

        return {
          unit,
          policyId,
          assetName,
          quantity: quantity.toString(),
          displayName
        };
      });

      // Sort assets: ADA first, then by display name
      assets.sort((a, b) => {
        if (a.unit === 'lovelace') return -1;
        if (b.unit === 'lovelace') return 1;
        return (a.displayName || a.unit).localeCompare(b.displayName || b.unit);
      });

      return assets;
    } catch (error) {
      console.error('Error loading assets from address:', error);
      throw error;
    }
  }

  // Helper to convert hex asset name to readable string
  private hexToString(hex: string): string {
    try {
      // Remove '0x' prefix if present
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      // Convert hex to bytes then to string
      const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      return new TextDecoder().decode(bytes).replace(/\0/g, '');
    } catch {
      return hex;
    }
  }

  getLucid(): Lucid | null {
    return this.lucid;
  }
}

export const lucidService = new LucidService();
export { LucidService };

