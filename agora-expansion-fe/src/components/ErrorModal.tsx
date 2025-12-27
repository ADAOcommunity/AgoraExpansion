import React from 'react';
import './ErrorModal.css';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletName: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, walletName }) => {
  if (!isOpen) return null;

  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="error-modal-header">
          <h2>Wallet Not Found</h2>
          <button className="error-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="error-modal-body">
          <p>
            <strong>{walletName}</strong> wallet is not installed or not detected in your browser.
          </p>
          <p>
            Please install {walletName} wallet extension to continue.
          </p>
        </div>
        <div className="error-modal-footer">
          <button className="error-modal-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

