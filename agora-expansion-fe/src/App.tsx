import React, { useState } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import TokenActions from './components/TokenActions';
import GenerateTokensConfig from './components/GenerateTokensConfig';
import RedeemTokensConfig from './components/RedeemTokensConfig';

type Screen = 'connect' | 'actions' | 'generate' | 'redeem';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('connect');
  const [walletAddress, setWalletAddress] = useState<string>('');

  const handleWalletConnect = () => {
    setWalletAddress('addr1...99cg'); // This would come from actual wallet connection
    setCurrentScreen('actions');
  };

  const handleSignOut = () => {
    setWalletAddress('');
    setCurrentScreen('connect');
  };

  const handleGenerateClick = () => {
    setCurrentScreen('generate');
  };

  const handleRedeemClick = () => {
    setCurrentScreen('redeem');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('actions');
  };

  return (
    <div className="App">
      {currentScreen === 'connect' && (
        <WalletConnect onConnect={handleWalletConnect} />
      )}
      
      {currentScreen === 'actions' && (
        <TokenActions 
          onGenerateClick={handleGenerateClick}
          onRedeemClick={handleRedeemClick}
        />
      )}
      
      {currentScreen === 'generate' && (
        <GenerateTokensConfig
          walletAddress={walletAddress}
          onBack={handleBackToDashboard}
          onSignOut={handleSignOut}
        />
      )}

      {currentScreen === 'redeem' && (
        <RedeemTokensConfig
          walletAddress={walletAddress}
          onBack={handleBackToDashboard}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

export default App;