# Frontend Blockfrost Setup

The frontend can connect a wallet without Blockfrost, but it cannot load wallet assets or proceed through the full configure, lock, and redeem flow until Blockfrost is configured.

## Create `.env`

From `agora-expansion-fe`:

```powershell
Copy-Item .env.example .env
```

Fill in the relevant project IDs:

```text
REACT_APP_BLOCKFROST_TESTNET_URL=https://cardano-preprod.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_TESTNET_API_KEY=your_preprod_or_preview_project_id

REACT_APP_BLOCKFROST_MAINNET_URL=https://cardano-mainnet.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_MAINNET_API_KEY=your_mainnet_project_id
```

Restart the dev server after changing `.env`:

```powershell
npm start
```

## Network Selection

The frontend detects the network from the connected wallet address:

- `addr1...` selects `Mainnet`.
- `addr_test1...` selects `Testnet`.
- Unknown address prefixes default to `Mainnet`.

If you use a Preprod wallet, keep the testnet URL set to the Preprod Blockfrost endpoint. If you use another Blockfrost-supported test network, update `REACT_APP_BLOCKFROST_TESTNET_URL` accordingly.

## Wallet Requirements

Install and unlock a supported CIP-30 browser wallet:

- Eternl
- Lace
- Yoroi

The wallet must expose a `window.cardano.<walletName>` API and support wallet enablement, address reads, signing, and transaction submission.

## Troubleshooting

### Blockfrost API key not configured

Set the API key for the network selected by the wallet address:

```text
REACT_APP_BLOCKFROST_TESTNET_API_KEY=...
REACT_APP_BLOCKFROST_MAINNET_API_KEY=...
```

Then restart the React dev server.

### Wallet connects but assets do not load

Check:

- The wallet network matches the configured Blockfrost URL.
- The wallet has UTxOs on that network.
- `.env` is located in `agora-expansion-fe/`.
- The dev server was restarted after editing `.env`.

### Static deployment cannot read local `.env`

Create React App embeds `REACT_APP_*` variables at build time. For GitHub Pages or other static hosting, provide these values during the production build. Do not expect a local `.env` file to be read after deployment.

### API key safety

Do not commit real Blockfrost project IDs. Browser builds expose bundled values to users, so use a rate-limited public project ID or add a runtime configuration layer for production.

Official Blockfrost documentation:

https://blockfrost.dev/
