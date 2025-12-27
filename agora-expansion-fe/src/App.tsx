import React, { useState } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import TokenActions from './components/TokenActions';
import TokenConfig from './components/TokenConfig';
import TokenSelection from './components/TokenSelection';
import NFTSelection from './components/NFTSelection';

type Screen = 'connect' | 'config' | 'actions' | 'select-tokens' | 'select-nft';

interface TokenConfigData {
  operation: 'sum' | 'multiply';
  configs: Array<{ weight: string; assetConfig: string }>;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('connect');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletName, setWalletName] = useState<string>('');
  const [configData, setConfigData] = useState<TokenConfigData | null>(null);
  const [selectedAction, setSelectedAction] = useState<'generate' | 'redeem' | null>(null);

  const handleWalletConnect = (walletAddress: string, walletName: string) => {
    setWalletAddress(walletAddress);
    setWalletName(walletName);
    setCurrentScreen('config');
  };

  const handleSignOut = () => {
    setWalletAddress('');
    setWalletName('');
    setConfigData(null);
    setSelectedAction(null);
    setCurrentScreen('connect');
  };

  const handleConfigSubmit = (config: TokenConfigData) => {
    setConfigData(config);
    setCurrentScreen('actions');
  };

  const handleGenerateClick = () => {
    setSelectedAction('generate');
    setCurrentScreen('select-tokens');
  };

  const handleRedeemClick = () => {
    setSelectedAction('redeem');
    setCurrentScreen('select-nft');
  };

  const handleBackToConfig = () => {
    setSelectedAction(null);
    setCurrentScreen('config');
  };

  const handleBackToActions = () => {
    setSelectedAction(null);
    setCurrentScreen('actions');
  };

  return (
    <div className="App">
      {currentScreen === 'connect' && (
        <WalletConnect onConnect={handleWalletConnect} />
      )}

      {currentScreen === 'config' && walletAddress && (
        <TokenConfig
          walletAddress={walletAddress}
          walletName={walletName}
          onSignOut={handleSignOut}
          onSubmit={handleConfigSubmit}
        />
      )}
      
      {currentScreen === 'actions' && (
        <TokenActions 
          onGenerateClick={handleGenerateClick}
          onRedeemClick={handleRedeemClick}
          onBack={handleBackToConfig}
        />
      )}

      {currentScreen === 'select-tokens' && walletAddress && (
        <TokenSelection
          walletAddress={walletAddress}
          walletName={walletName}
          onSignOut={handleSignOut}
          onBack={handleBackToActions}
          configData={configData}
        />
      )}

      {currentScreen === 'select-nft' && walletAddress && (
        <NFTSelection
          walletAddress={walletAddress}
          walletName={walletName}
          onSignOut={handleSignOut}
          onBack={handleBackToActions}
          configData={configData}
        />
      )}
    </div>
  );
}

export default App;