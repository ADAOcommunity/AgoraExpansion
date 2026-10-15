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
  const configuredProviders = [
    process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY?.trim() ? 'Testnet' : '',
    process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY?.trim() ? 'Mainnet' : '',
  ].filter(Boolean);
  const hasBlockfrostConfiguration = configuredProviders.length > 0;

  const connectWallet = async (walletName: WalletName) => {
    if (!hasBlockfrostConfiguration) return;
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
          <p className="title">Governance developer interface</p>
          <h1 className="subtitle">Agora Expansion</h1>

          <section className="wallet-review-notice" aria-labelledby="wallet-review-heading">
            <h2 id="wallet-review-heading">Before connecting</h2>
            <p>
              This interface configures NFT and fungible-token voting-power rules
              and supports the lock-and-redeem workflow.
            </p>
            <p>
              Asset loading and transactions require a matching Blockfrost
              project ID supplied when the app is built. Wallet connection does
              not supply an API key, and this page cannot accept your own key at runtime.
            </p>
            <p>
              A wallet alone is not enough: use Preprod test ADA and NFTs or
              fungible tokens matching the configured voting rules. This page
              does not provide test assets. Redeeming also requires a receipt
              from an earlier lock.
            </p>
            <p id="wallet-configuration-status" className="wallet-configuration-status" role="status">
              {hasBlockfrostConfiguration
                ? `Keys supplied for: ${configuredProviders.join(', ')}. Match your wallet to the configured provider's network. Key validity and transaction readiness are not verified here.`
                : 'Wallet connection is disabled: this build has no Blockfrost key. You can still open the tutorial and setup guide below.'}
            </p>
            <p>
              For transaction review, run locally with your own Preprod
              Blockfrost project and test assets. The setup guide lists the
              current testnet limitation. Do not use real funds; this is not a
              security-audited Mainnet service.
            </p>
            <nav className="wallet-review-links" aria-label="Demo documentation">
              <a href="https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/tutorial">
                Tutorial and screenshots
              </a>
              <a href="https://github.com/ADAOcommunity/AgoraExpansion/blob/main/docs/milestone-5/frontend-blockfrost-setup.md">
                Local setup guide
              </a>
            </nav>
          </section>
          
          <div className="wallet-buttons">
            <button 
              className="wallet-button eternl" 
              onClick={() => handleWalletClick('eternl')}
              disabled={connecting || !hasBlockfrostConfiguration}
              aria-describedby="wallet-configuration-status"
            >
              <img src={`${process.env.PUBLIC_URL}/eternl.svg`} alt="Eternl" />
              <span>Eternl</span>
            </button>
            <button 
              className="wallet-button lace" 
              onClick={() => handleWalletClick('lace')}
              disabled={connecting || !hasBlockfrostConfiguration}
              aria-describedby="wallet-configuration-status"
            >
              <img src={`${process.env.PUBLIC_URL}/lace.svg`} alt="Lace" />
              <span>Lace</span>
            </button>
            <button 
              className="wallet-button yoroi" 
              onClick={() => handleWalletClick('yoroi')}
              disabled={connecting || !hasBlockfrostConfiguration}
              aria-describedby="wallet-configuration-status"
            >
              <img src={`${process.env.PUBLIC_URL}/yoroi.svg`} alt="Yoroi" />
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
