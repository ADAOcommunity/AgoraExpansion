# Frontend Blockfrost Setup

The frontend can connect a wallet without Blockfrost, but it cannot load wallet assets or proceed through the full configure, lock, and redeem flow until Blockfrost is configured.

## Review Environment

The documented transaction-review environment is a local build with a Preprod
wallet, test ADA, eligible test assets, and the reviewer's own Preprod Blockfrost
project ID. Do not use real funds or request the project team's API credentials.
The current testnet network-label limitation is described below; configuration
alone is not confirmation of successful end-to-end execution.

Clone the repository and install the frontend dependencies:

```powershell
git clone https://github.com/ADAOcommunity/AgoraExpansion.git
cd AgoraExpansion/agora-expansion-fe
npm ci
```

## Create `.env`

From `agora-expansion-fe`:

```powershell
Copy-Item .env.example .env
```

For Preprod review, set these values using your own Preprod project ID:

```text
REACT_APP_BLOCKFROST_TESTNET_URL=https://cardano-preprod.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_TESTNET_API_KEY=your_own_preprod_project_id

REACT_APP_BLOCKFROST_MAINNET_URL=https://cardano-mainnet.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_MAINNET_API_KEY=
```

Leave the Mainnet key blank for this review. Start the dev server after saving
`.env`, or stop and restart it if it was already running:

```powershell
npm start
```

Open `http://localhost:3000` and switch the wallet to Preprod before connecting.
Follow the [UI walkthrough](./ui-walkthrough.md) and compare it with the public
tutorial and video:

- https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/tutorial
- https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/walkthrough.html

## Network Selection

The frontend detects the network from the connected wallet address:

- `addr1...` selects `Mainnet`.
- `addr_test1...` selects `Testnet`.
- Unknown address prefixes default to `Mainnet`.

Keep the wallet, Blockfrost project, and provider URL on the same network. A
Preview project ID does not work against the Preprod endpoint. Both networks
use `addr_test1...` addresses, so that prefix cannot distinguish them.

### Current Testnet Network-Label Limitation

`LucidService.getNetworkFromAddress()` currently returns `Testnet` for a testnet
address. The installed Lucid library's `networkToId()` accepts `Mainnet`,
`Preprod`, `Preview`, and `Custom`, not `Testnet`. The testnet mapping must be
corrected before end-to-end Preprod transactions can be reproduced through the
frontend. Do not treat a configured key or successful asset loading as proof
that a lock or redeem transaction has completed. Preview is not separately
verified by this guide.

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

The hosted GUI has no runtime field for entering your own API key. Clone and
run locally for reviewer-owned credentials; editing a local `.env` cannot
configure the already-published GitHub Pages build.

### API key safety

Do not commit real Blockfrost project IDs. Browser builds expose bundled values to users, so use a rate-limited public project ID or add a runtime configuration layer for production.

Official Blockfrost documentation:

https://blockfrost.dev/
