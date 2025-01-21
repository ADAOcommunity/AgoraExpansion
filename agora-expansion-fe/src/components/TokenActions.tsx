import React from 'react';
import './TokenActions.css';

interface TokenActionsProps {
  onGenerateClick: () => void;
  onRedeemClick: () => void;
}

const TokenActions: React.FC<TokenActionsProps> = ({
  onGenerateClick,
  onRedeemClick,
}) => {
  return (
    <div className="token-actions-container">
      <div className="token-actions-card">
        <h1 className="title">What would you like to do?</h1>
        <div className="actions">
          <div className="action-button generate" onClick={onGenerateClick}>
            <div className="icon">+</div>
            <div className="label">
              <div>Generate</div>
              <div className="sublabel">Governance Tokens</div>
            </div>
          </div>
          <div className="action-button redeem" onClick={onRedeemClick}>
            <div className="icon">✓</div>
            <div className="label">
              <div>Redeem</div>
              <div className="sublabel">Governance Tokens</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenActions; 