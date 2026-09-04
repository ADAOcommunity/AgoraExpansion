# AgoraExpansion

Repository to house new validators and off-chain code for leveraging Agora with NFTs and FTs as governance voting power.

The repository contains a multi-validator in `agora-expansion/validators/governance-token.ak`. The multi-validator supports minting the token that represents voting power, and a locker that holds the NFTs and FTs used to generate that voting power. A user locks their tokens to mint an alternative token used for voting as described in the research in the `ResearchPhase` directory. In addition to the voting power token, a receipt is minted so the user's NFTs and FTs can be claimed when burning the correct amount of voting power.

## Repository layout

- `agora-expansion`: validators, off-chain transaction building code, and emulator tests.
- `agora-expansion-fe`: public graphical user interface for the expansion lock/redeem flow.
- `ResearchPhase`: research notes and design references for using native assets as voting power.

## Public GUI

The public GUI is deployed at:

`https://adaocommunity.github.io/AgoraExpansion/`

This deployed interface is a static build of `agora-expansion-fe`. It requires Blockfrost configuration at build/deploy time so the app can read wallet assets and submit the normal lock/redeem flow.

## GUI local setup

Requirements:

- Node.js and npm.
- A Cardano browser wallet that exposes CIP-30.
- A Blockfrost project key for the network being tested.
- Testnet assets only when testing the preprod/testnet flow. Do not use real funds for test runs.

Run the frontend locally:

```bash
cd agora-expansion-fe
npm install
cp .env.example .env
npm start
```

PowerShell users can copy the environment file with:

```powershell
Copy-Item .env.example .env
```

The Create React App development server starts at `http://localhost:3000` by default.

## Blockfrost configuration

Create `agora-expansion-fe/.env` from `agora-expansion-fe/.env.example`, then add the Blockfrost key for the network you are testing.

```bash
REACT_APP_BLOCKFROST_MAINNET_URL=https://cardano-mainnet.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_MAINNET_API_KEY=

REACT_APP_BLOCKFROST_TESTNET_URL=https://cardano-preprod.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_TESTNET_API_KEY=
```

The `REACT_APP_` prefix is required because this frontend uses Create React App. Environment variables are read when `npm start` or `npm run build` starts. If the app shows `Blockfrost API key not configured`, add the matching `REACT_APP_BLOCKFROST_*_API_KEY` value and restart the dev server or rebuild the production bundle.

Do not commit real Blockfrost API keys. Use repository or deployment secrets for hosted builds.

## GUI user flow

Community or configuration flow:

1. Open the GUI and connect a Cardano wallet.
2. Configure the governance asset rules for the community, including the FT and/or NFT policy IDs, asset names when required, and voting weights.
3. Submit the configuration used by the expansion flow.

Voter lock/redeem flow:

1. Open the GUI and connect a Cardano wallet that holds eligible configured assets.
2. Review the detected FT/NFT assets and select the assets to use for voting power.
3. Submit the lock transaction. The selected assets are locked by the validator.
4. Receive voting power plus a receipt token.
5. Use the voting power in the Agora governance flow.
6. Redeem by burning the required voting power/receipt pair to reclaim the locked assets.

## Production build and deployment

Build the frontend:

```bash
cd agora-expansion-fe
npm install
npm run build
```

The frontend package uses `"homepage": "."` so asset paths are relative and can be served from GitHub Pages at `https://adaocommunity.github.io/AgoraExpansion/`.

For GitHub Pages or any hosted deployment, provide the `REACT_APP_BLOCKFROST_*` variables during the build. React embeds these values into the static bundle at build time.

## Contract test suite

The repository also contains off-chain transaction building code in `agora-expansion/src/index.ts` and emulator testing code in `agora-expansion/src/test.ts`.

The user can verify the test suite by running:

```bash
npm install
npm run test
```

in the `agora-expansion` directory. This assumes that the user has npm installed locally.
