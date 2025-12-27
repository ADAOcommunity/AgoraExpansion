import React, { useState } from 'react';
import './WalletConnect.css';
import ErrorModal from './ErrorModal';
import { LucidService } from '../services/lucidService';
import { Network } from 'lucid-cardano';

interface WalletConnectProps {
  onConnect: (walletAddress: string, walletName: string) => void;
}

type WalletName = 'eternl' | 'lace' | 'yoroi';

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorWalletName, setErrorWalletName] = useState<string>('');
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async (walletName: WalletName) => {
    setConnecting(true);
    
    try {
      // Check if window.cardano exists
      if (typeof window === 'undefined' || !window.cardano) {
        throw new Error('Cardano wallets not detected');
      }

      // Get the wallet API based on the wallet name
      const walletAPI = window.cardano[walletName];
      
      // Check if the specific wallet is available
      if (!walletAPI) {
        throw new Error(`Wallet ${walletName} not found`);
      }

      // Enable the wallet (CIP-30)
      const api = await walletAPI.enable();
      
      // Get the wallet address - try multiple methods for compatibility
      let walletAddress: string | undefined;
      
      // Try getChangeAddress first (most reliable)
      try {
        walletAddress = await api.getChangeAddress();
      } catch (e) {
        // Fall back to getUnusedAddresses
        try {
          const unusedAddresses = await api.getUnusedAddresses();
          if (unusedAddresses && unusedAddresses.length > 0) {
            walletAddress = unusedAddresses[0];
          }
        } catch (e2) {
          // Fall back to getUsedAddresses
          const usedAddresses = await api.getUsedAddresses();
          if (usedAddresses && usedAddresses.length > 0) {
            walletAddress = usedAddresses[0];
          }
        }
      }

      if (!walletAddress) {
        throw new Error('No addresses found in wallet');
      }

      // Convert hex address to bech32 if needed
      if (LucidService.isHexAddress(walletAddress)) {
        // Get network ID to determine which network to use for conversion
        let network: 'Mainnet' | 'Testnet' = 'Mainnet';
        try {
          const networkId = await api.getNetworkId();
          // CIP-30: Network ID 0 = Testnet, 1 = Mainnet
          network = networkId === 1 ? 'Mainnet' : 'Testnet';
        } catch (e) {
          console.warn('Could not get network ID, defaulting to Mainnet');
        }
        
        walletAddress = await LucidService.hexToBech32(walletAddress, network as Network);
      }
      
      // Successfully connected - call onConnect with address and wallet name
      onConnect(walletAddress, walletName);
    } catch (error) {
      // Show error modal
      const displayName = walletName.charAt(0).toUpperCase() + walletName.slice(1);
      setErrorWalletName(displayName);
      setErrorModalOpen(true);
    } finally {
      setConnecting(false);
    }
  };

  const handleWalletClick = (walletName: WalletName) => {
    connectWallet(walletName);
  };

  return (
    <>
      <div className="wallet-connect-container">
        <div className="wallet-card">
          <div className="wallet-icon">
            {/* Wallet icon will be styled via CSS */}
          </div>
          <h2 className="title">WEB3 GOVERNANCE TOKEN</h2>
          <h1 className="subtitle">Connect your wallet to get started</h1>
          
          <div className="wallet-buttons">
            <button 
              className="wallet-button eternl" 
              onClick={() => handleWalletClick('eternl')}
              disabled={connecting}
            >
              <img src="/eternl.svg" alt="Eternl" />
              <span>Eternl</span>
            </button>
            <button 
              className="wallet-button lace" 
              onClick={() => handleWalletClick('lace')}
              disabled={connecting}
            >
              <img src="/lace.svg" alt="Lace" />
              <span>Lace</span>
            </button>
            <button 
              className="wallet-button yoroi" 
              onClick={() => handleWalletClick('yoroi')}
              disabled={connecting}
            >
              <img src="/yoroi.svg" alt="Yoroi" />
              <span>Yoroi</span>
            </button>
          </div>

          {connecting && (
            <p className="connecting-message">Connecting to wallet...</p>
          )}

          <p className="wallet-note">Wallet not on the list? Let us know!</p>
        </div>
      </div>

      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        walletName={errorWalletName}
      />
    </>
  );
};

export default WalletConnect; 