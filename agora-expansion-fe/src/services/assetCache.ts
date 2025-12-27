// Asset cache service to store loaded assets from wallet

export interface Asset {
  unit: string; // Full unit identifier (policyId + assetName for native assets, 'lovelace' for ADA)
  policyId: string; // Policy ID (empty string for ADA)
  assetName: string; // Asset name (hex encoded, empty string for ADA)
  quantity: string; // Quantity as string (BigInt compatible)
  displayName?: string; // Human-readable name if available
}

export class AssetCache {
  private cache: Map<string, Asset> = new Map();
  private lastUpdated: number = 0;
  private cachedAddress: string | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  setAssets(assets: Asset[], address: string): void {
    this.cache.clear();
    assets.forEach(asset => {
      this.cache.set(asset.unit, asset);
    });
    this.lastUpdated = Date.now();
    this.cachedAddress = address;
  }

  getAssets(address: string): Asset[] {
    // If address changed or cache is stale, return empty array
    if (this.cachedAddress !== address || this.isStale()) {
      return [];
    }
    return Array.from(this.cache.values());
  }

  getAsset(unit: string): Asset | undefined {
    return this.cache.get(unit);
  }

  isStale(): boolean {
    return Date.now() - this.lastUpdated > this.CACHE_DURATION;
  }

  clear(): void {
    this.cache.clear();
    this.lastUpdated = 0;
    this.cachedAddress = null;
  }

  // Check if cache is valid for the given address
  isValidForAddress(address: string): boolean {
    return this.cachedAddress === address && !this.isStale() && this.cache.size > 0;
  }

  // Helper to convert hex asset name to readable string
  static hexToString(hex: string): string {
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
}

export const assetCache = new AssetCache();

