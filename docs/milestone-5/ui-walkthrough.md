# UI Walkthrough

Public GUI:

https://adaocommunity.github.io/AgoraExpansion/

## 1. Connect Wallet

Open the GUI and choose a supported wallet:

- Eternl
- Lace
- Yoroi

The frontend uses the wallet's CIP-30 API to read addresses and later request signatures.

## 2. Configure Voting Power

After connecting, the token configuration screen lets the user choose:

- Operation: `Sum` or `Multiply`
- Weight for each asset rule
- Token type: `FT` or `NFT`
- Asset selected from the connected wallet

The frontend uses Blockfrost through Lucid to load wallet assets into the asset dropdown.

## 3. Generate Voting Power

Choose `Generate` to lock configured assets.

The UI builds a wallet-signed transaction that:

- Locks the selected assets.
- Mints voting power according to the configuration.
- Mints a receipt NFT for later retrieval.

## 4. Redeem Receipt NFT

Choose `Redeem` to load receipt NFTs from the wallet.

The UI searches for receipt NFTs matching the configured minter policy. The user selects a receipt NFT and submits a redeem transaction to recover locked assets.

## Evidence Notes

For milestone proof, pair this walkthrough with:

- A repository commit or release link.
- The deployed GUI link.
- Screenshots or video of the UI flow.
- Live transaction links if required by the reviewer.
