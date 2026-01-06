import React, { useState, useEffect, useCallback } from 'react';
import './TokenSelection.css';
import { assetCache, Asset } from '../services/assetCache';
import AssetSearchDropdown from './AssetSearchDropdown';
import { lucidService, LucidService } from '../services/lucidService';
import { Assets } from 'lucid-cardano';

interface TokenSelectionProps {
  walletAddress: string;
  walletName: string;
  onSignOut: () => void;
  onBack: () => void;
  configData: any;
}

interface SelectedAsset extends Asset {
  amount: string; // Amount of the asset to lock
  weight: string; // Weight from config (read-only)
}

const TokenSelection: React.FC<TokenSelectionProps> = ({
  walletAddress,
  walletName,
  onSignOut,
  onBack,
  configData
}) => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWalletAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have cached assets for this address that aren't stale
      if (assetCache.isValidForAddress(walletAddress)) {
        setAllAssets(assetCache.getAssets(walletAddress));
        setLoading(false);
        return;
      }

      // Initialize Lucid with Blockfrost if not already initialized
      try {
        if (!lucidService.getLucid()) {
          // Get network from address (bech32 format)
          const network = LucidService.getNetworkFromAddress(walletAddress);
          await lucidService.initialize(network);
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Failed to initialize Lucid';
        setError(`Failed to initialize: ${errorMsg}. Please check your Blockfrost API key.`);
        setLoading(false);
        return;
      }

      // Use Lucid to get all assets from the wallet address
      try {
        const assets = await lucidService.getAssetsFromAddress(walletAddress);
        
        if (assets.length === 0) {
          setError('No assets found in wallet.');
          setLoading(false);
          return;
        }

        assetCache.setAssets(assets, walletAddress);
        setAllAssets(assets);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Failed to load assets';
        setError(`Failed to load assets: ${errorMsg}`);
        console.error('Error loading assets:', e);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets from wallet');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadWalletAssets();
  }, [loadWalletAssets]);

  // Filter assets to only those that match the config
  const configMatchingAssets = React.useMemo(() => {
    if (!configData || !configData.configs || configData.configs.length === 0) {
      return allAssets;
    }

    // Extract asset configs from the config data
    const validAssetConfigs = configData.configs.map((config: { weight: string; assetConfig: string }) => config.assetConfig);

    return allAssets.filter(asset => {
      // Check if this asset matches any of the configured asset configs
      for (const assetConfig of validAssetConfigs) {
        if (assetConfig === 'lovelace' && asset.unit === 'lovelace') {
          return true;
        }
        
        // For policy-only assets: assetConfig is just the policyId
        if (assetConfig === asset.policyId && !asset.assetName) {
          return true;
        }
        
        // For named assets: assetConfig is policyId + assetName
        if (asset.assetName && assetConfig === `${asset.policyId}${asset.assetName}`) {
          return true;
        }
        
        // Also check by unit (full identifier)
        if (assetConfig === asset.unit) {
          return true;
        }
      }
      return false;
    });
  }, [allAssets, configData]);

  // Get available assets (not yet selected) that match the config
  const availableAssets = configMatchingAssets.filter(asset => 
    !selectedAssets.some(selected => selected.unit === asset.unit)
  );

  // Helper to get weight from config for a given asset
  const getWeightFromConfig = (asset: Asset): string => {
    if (!configData || !configData.configs || configData.configs.length === 0) {
      return '';
    }

    for (const config of configData.configs) {
      const assetConfig = config.assetConfig;
      
      // Check if this asset matches the config
      if (assetConfig === 'lovelace' && asset.unit === 'lovelace') {
        return config.weight;
      }
      
      // For policy-only assets
      if (assetConfig === asset.policyId && !asset.assetName) {
        return config.weight;
      }
      
      // For named assets
      if (asset.assetName && assetConfig === `${asset.policyId}${asset.assetName}`) {
        return config.weight;
      }
      
      // Also check by unit
      if (assetConfig === asset.unit) {
        return config.weight;
      }
    }
    
    return '';
  };

  const handleAssetSelect = (asset: Asset) => {
    const weight = getWeightFromConfig(asset);
    const selectedAsset: SelectedAsset = {
      ...asset,
      amount: '',
      weight: weight
    };
    setSelectedAssets(prev => [...prev, selectedAsset]);
  };

  const handleAssetDeselect = (unit: string) => {
    setSelectedAssets(prev => prev.filter(asset => asset.unit !== unit));
  };

  const handleAmountChange = (unit: string, amount: string) => {
    setSelectedAssets(prev =>
      prev.map(asset =>
        asset.unit === unit ? { ...asset, amount } : asset
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      // Validate that all selected assets have amounts
      const invalidAssets = selectedAssets.filter(asset => !asset.amount || asset.amount.trim() === '');
      if (invalidAssets.length > 0) {
        setError('Please set amounts for all selected assets');
        return;
      }

      if (!configData || !configData.configs || configData.configs.length === 0) {
        setError('Configuration data is missing');
        return;
      }

      // Get wallet API
      if (typeof window === 'undefined' || !window.cardano) {
        setError('Cardano wallets not detected');
        return;
      }

      const walletAPI = window.cardano[walletName as 'eternl' | 'lace' | 'yoroi'];
      if (!walletAPI) {
        setError(`Wallet ${walletName} not found`);
        return;
      }

      const api = await walletAPI.enable();

      // Ensure Lucid is initialized
      const lucid = lucidService.getLucid();
      if (!lucid) {
        const network = LucidService.getNetworkFromAddress(walletAddress);
        await lucidService.initialize(network);
      }

      // Get the initialized Lucid instance and select wallet
      const currentLucid = lucidService.getLucid();
      if (!currentLucid) {
        setError('Failed to initialize Lucid');
        return;
      }

      // Select the wallet
      currentLucid.selectWallet(api);

      // Convert selected assets to Assets format
      const assetsToLock: Assets = {};
      const MIN_LOVELACE = BigInt(3000000); // 3 ADA minimum for UTxO
      
      for (const asset of selectedAssets) {
        // Ensure amount is a valid number string before converting to BigInt
        const amountStr = asset.amount.trim();
        if (!amountStr || isNaN(Number(amountStr))) {
          setError(`Invalid amount for ${asset.displayName || asset.unit}: ${asset.amount}`);
          return;
        }
        
        if (asset.unit === 'lovelace') {
          // For ADA: convert from ADA to lovelace (1 ADA = 1,000,000 lovelace)
          // Support decimals like "1.5" ADA
          const adaAmount = parseFloat(amountStr);
          let lovelaceAmount = BigInt(Math.floor(adaAmount * 1000000));
          
          // Ensure minimum lovelace for UTxO
          if (lovelaceAmount < MIN_LOVELACE) {
            lovelaceAmount = MIN_LOVELACE;
          }
          
          assetsToLock.lovelace = lovelaceAmount;
        } else {
          const amount = BigInt(amountStr);
          assetsToLock[asset.unit] = amount;
        }
      }

      // Convert config to powerList format (filter out empty configs first)
      const powerList = configData.configs
        .filter((config: { weight: string; assetConfig: string }) => 
          config.weight && config.weight.trim() !== '' && 
          config.assetConfig && config.assetConfig.trim() !== ''
        )
        .map((config: { weight: string; assetConfig: string }) => {
          // Parse assetConfig to determine policy and asset
          let policy = '';
          let asset: string | undefined = undefined;
          let c: "P" | "A" = "P";

          if (config.assetConfig === 'lovelace') {
            // Lovelace: use empty policy and "P" type
            policy = '';
            c = "P";
          } else if (config.assetConfig.length === 56) {
            // Policy-only asset
            policy = config.assetConfig;
            c = "P";
          } else {
            // Named asset: policyId (56 chars) + assetName
            policy = config.assetConfig.slice(0, 56);
            asset = config.assetConfig.slice(56);
            c = "A";
          }

          return {
            weight: BigInt(config.weight),
            assetConfig: {
              AssetSelection: {
                assetSelection: {
                  policy,
                  ...(asset && { asset }),
                  c
                }
              }
            }
          };
        });

      // Determine action
      const action = configData.operation === 'sum' ? 'Sum' : 'Multiply';

      // Validate powerList is not empty
      if (powerList.length === 0) {
        setError('No valid power configurations found. Please check your token configuration.');
        return;
      }

      console.log('Building transaction with:', {
        assetsToLock,
        action,
        powerList: powerList.map((p: { weight: bigint; assetConfig: { AssetSelection: { assetSelection: { policy: string; c: string } } } }) => ({
          weight: p.weight.toString(),
          policy: p.assetConfig.AssetSelection.assetSelection.policy,
          c: p.assetConfig.AssetSelection.assetSelection.c
        }))
      });

      // Build and sign transaction
      const { lockTokens } = await import('../services/lockTokensService');
      // Note: We need to cast Lucid to match the expected type from agora-expansion
      const tx = await lockTokens(currentLucid as any, assetsToLock, action, powerList);

      console.log(tx.toString());
      
      // Sign the transaction
      const signedTx = await tx.sign().complete();
      
      // Submit the transaction
      const txHash = await signedTx.submit();
      
      console.log('Transaction submitted:', txHash);
      setError(null);
      alert(`Transaction submitted successfully!\nTransaction Hash: ${txHash}`);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to lock tokens';
      setError(errorMsg);
      console.error('Error locking tokens:', err);
    }
  };

  return (
    <div className="token-selection-container">
      <div className="token-selection-card">
        <div className="header">
          <button className="back-button" onClick={onBack}>← Back</button>
          <div className="wallet-info">
            <div className="wallet-icon">W</div>
            <div className="wallet-details">
              <div>Connected Wallet</div>
              <div className="wallet-address">{walletAddress}</div>
            </div>
          </div>
          <button className="sign-out" onClick={onSignOut}>Sign Out</button>
        </div>

        <h1>Select Assets to Lock</h1>
        
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading assets from wallet...</div>
        ) : (
          <>
            <div className="asset-selection-section">
              <h2>Select Assets</h2>
              {configData && configData.configs && configData.configs.length > 0 ? (
                <p className="config-info">
                  Only assets matching your configuration are shown below.
                </p>
              ) : null}
              <div className="dropdown-container">
                <AssetSearchDropdown
                  assets={availableAssets}
                  onSelect={handleAssetSelect}
                  placeholder="Search and select an asset..."
                  disabled={loading || availableAssets.length === 0}
                />
                {availableAssets.length === 0 && configMatchingAssets.length > 0 && (
                  <p className="all-assets-selected">All matching assets have been selected</p>
                )}
                {availableAssets.length === 0 && configMatchingAssets.length === 0 && allAssets.length > 0 && (
                  <p className="no-matching-assets">
                    No assets in your wallet match the configured asset types. Please check your configuration.
                  </p>
                )}
              </div>
            </div>

            <div className="selected-assets-section">
              <h2>Selected Assets ({selectedAssets.length})</h2>
              <div className="selected-assets-list">
                {selectedAssets.length === 0 ? (
                  <div className="empty-state">No assets selected. Use the search above to add assets.</div>
                ) : (
                  selectedAssets.map(asset => (
                    <div 
                      key={asset.unit} 
                      className="asset-item selected"
                    >
                      <div className="asset-info">
                        <div className="asset-name">{asset.displayName || asset.unit}</div>
                        <div className="asset-details">
                          {asset.unit !== 'lovelace' && (
                            <div className="asset-policy">{asset.policyId.slice(0, 16)}...</div>
                          )}
                          <div className="asset-quantity">
                            {asset.unit === 'lovelace' 
                              ? `${Number(BigInt(asset.quantity) / BigInt(1000000)).toLocaleString()} ADA`
                              : Number(BigInt(asset.quantity)).toLocaleString()
                            }
                          </div>
                        </div>
                      </div>
                        <div className="asset-inputs-container">
                          <div className="weight-display">
                            <label className="weight-label">Weight:</label>
                            <div className="weight-value">{asset.weight || 'N/A'}</div>
                          </div>
                          <div className="amount-input-container">
                            <label className="amount-label">
                              {asset.unit === 'lovelace' ? 'Amount (ADA):' : 'Amount:'}
                            </label>
                            <input
                              type="text"
                              className="amount-input"
                              placeholder={asset.unit === 'lovelace' ? '0.0' : '0'}
                              value={asset.amount}
                              onChange={(e) => handleAmountChange(asset.unit, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      <button 
                        className="asset-remove"
                        onClick={() => handleAssetDeselect(asset.unit)}
                        title="Remove asset"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div className="action-buttons">
          <button 
            className="submit"
            onClick={handleSubmit}
            disabled={selectedAssets.length === 0 || selectedAssets.some(a => !a.amount || a.amount.trim() === '')}
          >
            Lock Selected Assets
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenSelection; 
