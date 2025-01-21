import React, { useState } from 'react';
import './RedeemTokensConfig.css';

interface RedeemTokensConfigProps {
  onBack: () => void;
  walletAddress: string;
  onSignOut: () => void;
}

interface PowerConfig {
  weight: string;
  assetConfig: string;
}

const RedeemTokensConfig: React.FC<RedeemTokensConfigProps> = ({
  onBack,
  walletAddress,
  onSignOut,
}) => {
  const [powerConfigs, setPowerConfigs] = useState<PowerConfig[]>([
    { weight: '', assetConfig: '' },
    { weight: '', assetConfig: '' },
    { weight: '', assetConfig: '' },
  ]);

  const handleRemoveConfig = (index: number) => {
    setPowerConfigs(powerConfigs.filter((_, i) => i !== index));
  };

  const handleAddConfig = () => {
    setPowerConfigs([...powerConfigs, { weight: '', assetConfig: '' }]);
  };

  const handleSubmit = () => {
    // Handle submission logic here
    console.log('Submitting redemption config:', powerConfigs);
  };

  return (
    <div className="redeem-tokens-container">
      <div className="redeem-tokens-card">
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

        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>

        <h1>Redeem Tokens</h1>

        <div className="config-section">
          <div className="action-type">
            <span>Sum</span>
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
                <input
                  type="text"
                  placeholder="Asset Config"
                  value={config.assetConfig}
                  onChange={(e) => {
                    const newConfigs = [...powerConfigs];
                    newConfigs[index].assetConfig = e.target.value;
                    setPowerConfigs(newConfigs);
                  }}
                />
                {index === 0 && (
                  <button className="remove-config" onClick={() => handleRemoveConfig(index)}>
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
          <button className="discard" onClick={onBack}>
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

export default RedeemTokensConfig; 