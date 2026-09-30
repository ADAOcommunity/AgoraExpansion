# AgoraExpansion Frontend

React frontend for the AgoraExpansion governance flow.

Public deployment:

https://adaocommunity.github.io/AgoraExpansion/

## What The Frontend Does

- Connects a CIP-30 Cardano wallet.
- Loads wallet assets through Lucid and Blockfrost.
- Lets users configure NFT and FT voting-power rules.
- Builds lock transactions that mint voting power and receipt NFTs.
- Builds redeem transactions that use receipt NFTs to retrieve locked assets.

Supported wallets:

- Eternl
- Lace
- Yoroi

## Install

```powershell
npm install
```

## Configure Blockfrost

Copy the environment example:

```powershell
Copy-Item .env.example .env
```

Fill in the project IDs for the networks you will use:

```text
REACT_APP_BLOCKFROST_TESTNET_URL=https://cardano-preprod.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_TESTNET_API_KEY=your_preprod_or_preview_project_id

REACT_APP_BLOCKFROST_MAINNET_URL=https://cardano-mainnet.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_MAINNET_API_KEY=your_mainnet_project_id
```

The app chooses the network from the connected wallet address:

- `addr1...` uses `Mainnet`.
- `addr_test1...` uses `Testnet`.

If the UI says a Blockfrost API key is not configured, set the matching `REACT_APP_BLOCKFROST_*_API_KEY` value and restart the app.

Do not commit real API keys, seed phrases, private keys, or wallet credentials.

## Run Locally

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

## Build

```powershell
npm run build
```

The static output is written to:

```text
build/
```

Because this is a static browser app, `REACT_APP_*` values are embedded at build time. For GitHub Pages or another static host, provide the Blockfrost values during the production build.

## Test

```powershell
npm test
```

## Troubleshooting

### Wallet connects but assets do not load

Check that:

- `.env` is in `agora-expansion-fe/`.
- The wallet network matches the Blockfrost URL.
- The wallet has UTxOs on that network.
- The React dev server was restarted after `.env` changes.

### Blockfrost API key warning appears after wallet connection

Set the missing key:

```text
REACT_APP_BLOCKFROST_TESTNET_API_KEY=...
REACT_APP_BLOCKFROST_MAINNET_API_KEY=...
```

Then restart `npm start`.

### Deployed app cannot read local `.env`

Static deployments cannot read a local `.env` at runtime. Add the values to the deployment build environment or implement a runtime configuration layer before production promotion.
