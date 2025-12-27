import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../services/assetCache';
import './AssetSearchDropdown.css';

interface AssetSearchDropdownProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  placeholder?: string;
  disabled?: boolean;
}

const AssetSearchDropdown: React.FC<AssetSearchDropdownProps> = ({
  assets,
  onSelect,
  placeholder = 'Search and select an asset...',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter assets based on search query
  const filteredAssets = assets.filter(asset => {
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const displayName = asset.displayName || asset.unit;
    const policyId = asset.policyId || '';
    const assetName = asset.assetName || '';

    return (
      displayName.toLowerCase().includes(query) ||
      policyId.toLowerCase().includes(query) ||
      assetName.toLowerCase().includes(query) ||
      asset.unit.toLowerCase().includes(query)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredAssets.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < filteredAssets.length) {
        e.preventDefault();
        handleSelect(filteredAssets[highlightedIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredAssets, highlightedIndex]);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const formatQuantity = (asset: Asset): string => {
    if (asset.unit === 'lovelace') {
      return `${(BigInt(asset.quantity) / BigInt(1000000)).toLocaleString()} ADA`;
    }
    return BigInt(asset.quantity).toLocaleString();
  };

  return (
    <div className="asset-search-dropdown" ref={dropdownRef}>
      <div className="dropdown-input-container">
        <input
          ref={inputRef}
          type="text"
          className="dropdown-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
        />
        <span className="dropdown-icon">🔍</span>
      </div>

      {isOpen && filteredAssets.length > 0 && (
        <div className="dropdown-menu">
          {filteredAssets.map((asset, index) => (
            <div
              key={asset.unit}
              className={`dropdown-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(asset)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="dropdown-item-content">
                <div className="dropdown-item-name">{asset.displayName || asset.unit}</div>
                <div className="dropdown-item-details">
                  {asset.unit !== 'lovelace' && asset.policyId && (
                    <span className="dropdown-item-policy">{asset.policyId.slice(0, 16)}...</span>
                  )}
                  <span className="dropdown-item-quantity">{formatQuantity(asset)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchQuery && filteredAssets.length === 0 && (
        <div className="dropdown-menu">
          <div className="dropdown-item no-results">No assets found</div>
        </div>
      )}
    </div>
  );
};

export default AssetSearchDropdown;

