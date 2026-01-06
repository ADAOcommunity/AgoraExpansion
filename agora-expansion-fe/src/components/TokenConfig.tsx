import React, { useState, useEffect, useCallback } from 'react';
import './TokenConfig.css';
import { assetCache, Asset } from '../services/assetCache';
import AssetSearchDropdown from './AssetSearchDropdown';
import { lucidService, LucidService } from '../services/lucidService';

interface TokenConfigProps {
  walletAddress: string;
  walletName: string;
  onSignOut: () => void;
  onSubmit: (config: { operation: OperationType; configs: PowerConfig[] }) => void;
}

interface PowerConfig {
  weight: string;
  assetConfig: string;
}

type OperationType = 'sum' | 'multiply';

const TokenConfig: React.FC<TokenConfigProps> = ({
  walletAddress,
  walletName,
  onSignOut,
  onSubmit,
}) => {
  const [operationType, setOperationType] = useState<OperationType>('sum');
  const [powerConfigs, setPowerConfigs] = useState<PowerConfig[]>([
    { weight: '', assetConfig: '' },
    { weight: '', assetConfig: '' },
    { weight: '', assetConfig: '' },
  ]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetLoadError, setAssetLoadError] = useState<string | null>(null);

  // Load config from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    if (configParam) {
      try {
        const savedConfig = JSON.parse(configParam);
        if (savedConfig.operation && savedConfig.configs) {
          setOperationType(savedConfig.operation);
          setPowerConfigs(savedConfig.configs);
        }
      } catch (e) {
        console.error('Failed to parse config from URL:', e);
      }
    }
  }, []);

  const loadWalletAssets = useCallback(async () => {
    try {
      setLoadingAssets(true);
      setAssetLoadError(null);

      // Check if we have cached assets for this address that aren't stale
      if (assetCache.isValidForAddress(walletAddress)) {
        setAllAssets(assetCache.getAssets(walletAddress));
        setLoadingAssets(false);
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
        setAssetLoadError(`Failed to initialize: ${errorMsg}. Please check your Blockfrost API key.`);
        setLoadingAssets(false);
        return;
      }

      // Use Lucid to get all assets from the wallet address
      try {
        const assets = await lucidService.getAssetsFromAddress(walletAddress);
        
        if (assets.length === 0) {
          setAssetLoadError('No assets found in wallet.');
          setLoadingAssets(false);
          return;
        }

        assetCache.setAssets(assets, walletAddress);
        setAllAssets(assets);
        setAssetLoadError(null);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Failed to load assets';
        setAssetLoadError(`Failed to load assets: ${errorMsg}`);
        console.error('Error loading assets:', e);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assets from wallet';
      setAssetLoadError(errorMessage);
      console.error('Failed to load assets from wallet:', err);
    } finally {
      setLoadingAssets(false);
    }
  }, [walletAddress]);

  // Load assets from wallet
  useEffect(() => {
    loadWalletAssets();
  }, [loadWalletAssets]);

  const handleRemoveConfig = () => {
    if (powerConfigs.length > 1) {
      setPowerConfigs(powerConfigs.slice(0, -1));
    }
  };

  const handleAddConfig = () => {
    setPowerConfigs([...powerConfigs, { weight: '', assetConfig: '' }]);
  };

  const handleSubmit = () => {
    // Encode the config in the URL
    const config = {
      operation: operationType,
      configs: powerConfigs
    };
    const queryParams = new URLSearchParams();
    queryParams.set('config', JSON.stringify(config));
    window.history.pushState({}, '', `?${queryParams.toString()}`);
    
    onSubmit(config);
  };

  return (
    <div className="token-config-container">
      <div className="token-config-card">
        <div className="header">
          <div className="wallet-info">
            <div className="wallet-icon">V</div>
            <div className="wallet-details">
              <div>Connected Wallet:</div>
              <div className="wallet-address">{walletAddress}</div>
            </div>
          </div>
          <button className="sign-out" onClick={onSignOut}>
            Sign Out
          </button>
        </div>

        <h1>Token Configuration</h1>

        <div className="config-section">
          <div className="action-type" onClick={() => setOperationType(operationType === 'sum' ? 'multiply' : 'sum')}>
            <span>{operationType === 'sum' ? 'Sum' : 'Multiply'}</span>
            <span className="dropdown-arrow">▼</span>
          </div>

          <div className="power-configs">
            {powerConfigs.map((config, index) => (
              <div key={index} className="config-row">
                <input
                  type="text"
                  placeholder="Weight"
                  value={config.weight}
                  onChange={(e) => {
                    const newConfigs = [...powerConfigs];
                    newConfigs[index].weight = e.target.value;
                    setPowerConfigs(newConfigs);
                  }}
                />
                <div className="asset-config-dropdown-wrapper">
                  {assetLoadError ? (
                    <div className="asset-load-error">
                      <div className="error-text">{assetLoadError}</div>
                      <button 
                        className="retry-button" 
                        onClick={loadWalletAssets}
                        type="button"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      <AssetSearchDropdown
                        assets={allAssets}
                        onSelect={(asset) => {
                          // Format: policyId for policy-only, or policyId + assetName for named assets
                          let assetConfigValue = '';
                          if (asset.unit === 'lovelace') {
                            assetConfigValue = 'lovelace';
                          } else if (asset.assetName) {
                            assetConfigValue = `${asset.policyId}${asset.assetName}`;
                          } else {
                            assetConfigValue = asset.policyId;
                          }
                          
                          const newConfigs = [...powerConfigs];
                          newConfigs[index].assetConfig = assetConfigValue;
                          setPowerConfigs(newConfigs);
                        }}
                        placeholder={loadingAssets ? 'Loading assets...' : allAssets.length === 0 ? 'No assets available' : 'Search and select asset...'}
                        disabled={loadingAssets || allAssets.length === 0}
                      />
                      {config.assetConfig && (
                        <div className="selected-asset-display">
                          {(() => {
                            const selectedAsset = allAssets.find(a => {
                              if (a.unit === 'lovelace' && config.assetConfig === 'lovelace') return true;
                              if (a.assetName && config.assetConfig === `${a.policyId}${a.assetName}`) return true;
                              if (!a.assetName && config.assetConfig === a.policyId) return true;
                              return false;
                            });
                            return selectedAsset ? selectedAsset.displayName || selectedAsset.unit : config.assetConfig.slice(0, 20) + '...';
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {powerConfigs.length > 1 && index === powerConfigs.length - 1 && (
                  <button className="remove-config" onClick={handleRemoveConfig}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="add-config" onClick={handleAddConfig}>
            + Add Power Config
          </button>
        </div>

        <div className="action-buttons">
          <button className="discard" onClick={onSignOut}>
            Discard and exit
          </button>
          <button className="submit" onClick={handleSubmit}>
            Submit Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenConfig; 
