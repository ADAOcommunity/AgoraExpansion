import React, { useState, useEffect } from 'react';
import './NFTSelection.css';
import { lucidService, LucidService } from '../services/lucidService';
import { getMinterPolicyId, retrieveTokens } from '../services/lockTokensService';
import { Asset, assetCache } from '../services/assetCache';

interface NFTSelectionProps {
  walletAddress: string;
  walletName?: string;
  onSignOut: () => void;
  onBack: () => void;
  configData: any;
}

interface ReceiptNFT {
  unit: string;       // policyId + assetName
  policyId: string;
  assetName: string;
  displayName: string;
}

type AssetConfig = { policy: string; asset?: string; c: "P" | "A" };

const NFTSelection: React.FC<NFTSelectionProps> = ({
  walletAddress,
  walletName = 'eternl',
  onSignOut,
  onBack,
  configData
}) => {
  const [availableNFTs, setAvailableNFTs] = useState<ReceiptNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<ReceiptNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReceiptNFTs();
  }, [walletAddress, configData]);

  // Convert configData to powerList format (same as TokenSelection)
  const buildPowerList = () => {
    if (!configData || !configData.configs) return [];
    
    return configData.configs
      .filter((config: { weight: string; assetConfig: string }) => 
        config.weight && config.weight.trim() !== '' && 
        config.assetConfig && config.assetConfig.trim() !== ''
      )
      .map((config: { weight: string; assetConfig: string }) => {
        let policy = '';
        let asset: string | undefined = undefined;
        let c: "P" | "A" = "P";

        if (config.assetConfig === 'lovelace') {
          policy = '';
          c = "P";
        } else if (config.assetConfig.length === 56) {
          policy = config.assetConfig;
          c = "P";
        } else {
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
              } as AssetConfig
            }
          }
        };
      });
  };

  const loadReceiptNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure Lucid is initialized
      if (!lucidService.getLucid()) {
        const network = LucidService.getNetworkFromAddress(walletAddress);
        await lucidService.initialize(network);
      }

      const lucid = lucidService.getLucid();
      if (!lucid) {
        setError('Failed to initialize Lucid');
        return;
      }

      // Build powerList from config
      const powerList = buildPowerList();
      if (powerList.length === 0) {
        setError('No valid power configuration found');
        return;
      }

      // Get the minter policy ID for this config
      const action = configData.operation === 'sum' ? 'Sum' : 'Multiply';
      const minterPolicyId = await getMinterPolicyId(lucid, action, powerList);
      console.log('Looking for receipt NFTs with policy:', minterPolicyId);

      // Get all assets from wallet
      let allAssets: Asset[] = [];
      if (assetCache.isValidForAddress(walletAddress)) {
        allAssets = assetCache.getAssets(walletAddress);
      } else {
        allAssets = await lucidService.getAssetsFromAddress(walletAddress);
        assetCache.setAssets(allAssets, walletAddress);
      }

      // Filter for NFTs that match the minter policy ID
      // Receipt NFTs have quantity of 1 and their asset name is a 32-byte hash (64 hex chars)
      const receiptNFTs: ReceiptNFT[] = allAssets
        .filter(asset => {
          if (asset.policyId !== minterPolicyId) return false;
          // Receipt NFT should have quantity 1 and asset name should be 64 hex chars (32 bytes)
          if (BigInt(asset.quantity) !== 1n) return false;
          if (!asset.assetName || asset.assetName.length !== 64) return false;
          // Exclude the voting_power token (hex for "voting_power")
          if (asset.assetName === '766f74696e675f706f776572') return false;
          return true;
        })
        .map(asset => ({
          unit: asset.unit,
          policyId: asset.policyId,
          assetName: asset.assetName || '',
          displayName: `Receipt: ${asset.assetName?.slice(0, 8)}...${asset.assetName?.slice(-8)}`
        }));

      console.log('Found receipt NFTs:', receiptNFTs);
      setAvailableNFTs(receiptNFTs);

      if (receiptNFTs.length === 0) {
        setError('No receipt NFTs found in your wallet for this configuration. Make sure you have locked tokens first.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load receipt NFTs';
      setError(errorMsg);
      console.error('Error loading receipt NFTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNFTSelect = (nft: ReceiptNFT) => {
    setSelectedNFT(nft);
  };

  const handleSubmit = async () => {
    if (!selectedNFT) return;

    try {
      setSubmitting(true);
      setError(null);

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

      const currentLucid = lucidService.getLucid();
      if (!currentLucid) {
        setError('Failed to initialize Lucid');
        return;
      }

      // Select the wallet
      currentLucid.selectWallet(api);

      // Build powerList from config
      const powerList = buildPowerList();
      const action = configData.operation === 'sum' ? 'Sum' : 'Multiply';

      console.log('Redeeming receipt:', selectedNFT.unit);
      console.log('With config:', { action, powerList });

      // Build and sign transaction
      const tx = await retrieveTokens(currentLucid as any, selectedNFT.unit, action, powerList);
      
      // Sign the transaction
      const signedTx = await tx.sign().complete();
      
      // Submit the transaction
      const txHash = await signedTx.submit();
      
      console.log('Transaction submitted:', txHash);
      setError(null);
      alert(`Tokens retrieved successfully!\nTransaction Hash: ${txHash}`);
      
      // Refresh the NFT list
      await loadReceiptNFTs();
      setSelectedNFT(null);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve tokens';
      setError(errorMsg);
      console.error('Error retrieving tokens:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nft-selection-container">
      <div className="nft-selection-card">
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

        <h1>Select Receipt NFT to Redeem</h1>
        <p className="description">
          Select a receipt NFT to unlock your tokens and burn the associated voting power.
        </p>
        
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading receipt NFTs...</div>
        ) : (
          <div className="nft-grid">
            {availableNFTs.length === 0 ? (
              <div className="empty-state">
                No receipt NFTs found. Lock some tokens first to receive receipt NFTs.
              </div>
            ) : (
              availableNFTs.map(nft => (
                <div 
                  key={nft.unit} 
                  className={`nft-item ${selectedNFT?.unit === nft.unit ? 'selected' : ''}`}
                  onClick={() => handleNFTSelect(nft)}
                >
                  <div className="nft-icon">🎫</div>
                  <div className="nft-details">
                    <div className="nft-name">{nft.displayName}</div>
                    <div className="nft-id">Policy: {nft.policyId.slice(0, 12)}...</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="submit"
            onClick={handleSubmit}
            disabled={!selectedNFT || submitting}
          >
            {submitting ? 'Redeeming...' : 'Redeem Selected NFT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTSelection;
