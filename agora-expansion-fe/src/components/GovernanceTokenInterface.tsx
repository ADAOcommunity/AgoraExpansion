import React, { useState, useEffect } from 'react';
import { cardanoService } from '../services/cardano';
import type { PowerListItem } from '../services/cardano';
import { Assets } from 'lucid-cardano';

const GovernanceTokenInterface: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    initializeCardano();
  }, []);

  const initializeCardano = async () => {
    try {
      await cardanoService.initialize();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Cardano');
    }
  };

  const connectWallet = async () => {
    try {
      await cardanoService.connectWallet();
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleLockTokens = async () => {
    setLoading(true);
    try {
      // Example values - you'll need to get these from user input or configuration
      const assetsToLock: Assets = {
        lovelace: BigInt(5000000) // 5 ADA
      };
      const action = "Sum";
      const powerList: PowerListItem[] = [
        {
          weight: BigInt(1),
          assetConfig: {
            AssetSelection: {
              assetSelection: {
                policy: "your-policy-id",
                c: "P"
              }
            }
          }
        }
      ];

      const txHash = await cardanoService.lockTokens(assetsToLock, action, powerList);
      console.log('Transaction submitted:', txHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieveTokens = async () => {
    setLoading(true);
    try {
      // Example values - you'll need to get these from user input
      const receipt = "your-receipt-id";
      const action = "Sum";
      const powerList: PowerListItem[] = [
        {
          weight: BigInt(1),
          assetConfig: {
            AssetSelection: {
              assetSelection: {
                policy: "your-policy-id",
                c: "P"
              }
            }
          }
        }
      ];

      const txHash = await cardanoService.retrieveTokens(receipt, action, powerList);
      console.log('Transaction submitted:', txHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="governance-token-interface">
      <h2>Governance Token Interface</h2>
      {error && <div className="error">{error}</div>}
      
      {!connected && (
        <button 
          onClick={connectWallet} 
          disabled={loading}
        >
          Connect Wallet
        </button>
      )}

      {connected && (
        <div className="actions">
          <button 
            onClick={handleLockTokens} 
            disabled={loading}
          >
            Lock Tokens
          </button>
          <button 
            onClick={handleRetrieveTokens} 
            disabled={loading}
          >
            Retrieve Tokens
          </button>
        </div>
      )}
      
      {loading && <div className="loading">Processing...</div>}
    </div>
  );
};

export default GovernanceTokenInterface;