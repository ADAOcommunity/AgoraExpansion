# Frontend Blockfrost Setup

The wallet-connect screen explains the configuration requirements before
requesting wallet access. If neither Blockfrost project ID is supplied at build
time, the wallet buttons are disabled and the tutorial/setup links remain
available. If a key is supplied, its provider is listed, but key validity and
successful transactions are not implied. The wallet's network must match the
provider configuration.

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

## Test Assets Required

A wallet connection and Blockfrost project ID alone are not enough for a full
transaction review. On Preprod, the wallet also needs:

- Test ADA to cover transaction fees and minimum-ADA output requirements.
- NFTs or fungible tokens matching the policy IDs and asset names in the voting
  configuration, for the operation being tested.
- A receipt from an earlier successful lock and the corresponding voting-power
  tokens when testing redemption.

The configuration screen selects assets from the connected wallet. Reviewers
can configure eligible assets in their own test wallet; they do not necessarily
need the original beta testers' NFTs. A wallet without eligible assets cannot
reproduce the asset-lock path. Neither Blockfrost nor this hosted page supplies
or mints test assets for the reviewer.

The Playwright-generated tutorial uses simulated wallet and transaction
responses. Use it to review the interface and expected steps, not as proof that
a live Preprod transaction occurred. Keep actual transaction records and
explorer links separate from tutorial media.

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
