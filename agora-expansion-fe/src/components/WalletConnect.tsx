import React from 'react';
import './WalletConnect.css';

interface WalletConnectProps {
  onConnect: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const handleWalletClick = () => {
    // Here you would implement the actual wallet connection logic
    onConnect();
  };

  return (
    <div className="wallet-connect-container">
      <div className="wallet-card">
        <div className="wallet-icon">
          {/* Wallet icon will be styled via CSS */}
        </div>
        <h2 className="title">WEB3 GOVERNANCE TOKEN</h2>
        <h1 className="subtitle">Connect your wallet to get started</h1>
        
        <div className="wallet-buttons">
          <button className="wallet-button vespr" onClick={handleWalletClick}>
            <img src="/vespr-icon.png" alt="VESPR" />
            <span>VESPR</span>
          </button>
          <button className="wallet-button begin" onClick={handleWalletClick}>
            <img src="/begin-icon.png" alt="begin" />
            <span>begin</span>
          </button>
          <button className="wallet-button yoroi" onClick={handleWalletClick}>
            <img src="/yoroi-icon.png" alt="Yoroi" />
            <span>Yoroi</span>
          </button>
        </div>

        <p className="wallet-note">Wallet not on the list? Let us know!</p>
      </div>
    </div>
  );
};

export default WalletConnect; 