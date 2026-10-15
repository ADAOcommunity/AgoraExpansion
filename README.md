# AgoraExpansion

Repository to house new validators and off-chain code for leveraging Agora with NFTs and FTs as governance voting power.

The repository contains a multi-validator in `agora-expansion/validators/governance-token.ak`. The multi-validator supports minting the token that represents voting power, and a locker that holds the NFTs and FTs used to generate that voting power. A user locks their tokens to mint an alternative token used for voting as described in the research in the `ResearchPhase` directory. In addition to the voting power token, a receipt is minted so the user's NFTs and FTs can be claimed when burning the correct amount of voting power.

## Project links

- Public GUI: https://adaocommunity.github.io/AgoraExpansion/
- Developer documentation: https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/
- Step-by-step tutorial: https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/tutorial
- Video walkthrough: https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/walkthrough.html
- GitHub releases: https://github.com/ADAOcommunity/AgoraExpansion/releases

## Stable release

The `Publish v1.0.0 stable release` workflow checks the frontend tests and build,
then creates the annotated `v1.0.0` tag and GitHub Release when the release
preparation is merged into `main`. Publication runs only in
`ADAOcommunity/AgoraExpansion`; pull requests run validation only.

The workflow uses the repository's automatic `GITHUB_TOKEN`. No personal access
token or Blockfrost key is required for release publication. An existing published
release is left intact, and an existing tag is never moved. A failed publication
can be retried by rerunning its workflow job.

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for the release contents and configuration
requirements. The versioned release identifies the source code; it does not certify
a security audit or a hosted Mainnet service.

## Repository layout

- `agora-expansion`: validators, off-chain transaction building code, and emulator tests.
- `agora-expansion-fe`: public graphical user interface for the expansion lock/redeem flow.
- `ResearchPhase`: research notes and design references for using native assets as voting power.

## Public GUI

The public GUI is deployed at:

`https://adaocommunity.github.io/AgoraExpansion/`

This deployed interface is a static build of `agora-expansion-fe`. It requires Blockfrost configuration at build/deploy time so the app can read wallet assets and submit the normal lock/redeem flow.

Before wallet connection, the interface explains its scope, shows whether any
Blockfrost project IDs were supplied at build time, and links to the tutorial
and local setup guide. If neither provider key is supplied, wallet connection is
disabled rather than leading to the missing-key error. A supplied key is not
confirmation of provider availability or successful transactions.

Supported CIP-30 wallets in the current frontend:

- Eternl
- Lace
- Yoroi

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

Official Blockfrost development documentation:

https://blockfrost.dev/

## Reviewer environment and reproduction route

Use a local frontend build with a Cardano **Preprod** wallet and test assets for
transaction review. The default testnet provider is Preprod; Preview credentials
are not interchangeable with Preprod credentials. Mainnet transactions and a
project-funded public Blockfrost service are not required for this review route.
Use your own Blockfrost project ID; do not request or share another person's key.

From a fresh directory:

```bash
git clone https://github.com/ADAOcommunity/AgoraExpansion.git
cd AgoraExpansion/agora-expansion-fe
npm ci
cp .env.example .env
```

On PowerShell, replace the last command with `Copy-Item .env.example .env`.
Edit `.env` before starting the app:

```text
REACT_APP_BLOCKFROST_TESTNET_URL=https://cardano-preprod.blockfrost.io/api/v0
REACT_APP_BLOCKFROST_TESTNET_API_KEY=your_own_preprod_project_id
```

Leave the Mainnet API key blank for a Preprod-only review. Then run `npm start`
and open `http://localhost:3000`. Restart the server after changing `.env`.
Switch the wallet to Preprod and use test ADA for fees plus eligible test FT/NFT
assets. A connected wallet alone does not establish that the provider is configured.

A Blockfrost key does not supply test ADA or mint eligible assets. Reviewers need
NFTs or fungible tokens matching the configured policy IDs and asset names; they
can configure rules around eligible assets in their own test wallet rather than
using the original beta testers' NFTs. An empty wallet cannot reproduce the asset
lock flow. Redeeming also requires the receipt and corresponding voting-power
tokens from an earlier lock. The hosted interface does not distribute test assets.

Follow the [UI walkthrough](./docs/milestone-5/ui-walkthrough.md): connect the
wallet, configure asset rules and weights, generate voting power by locking the
selected assets, then redeem the receipt to retrieve them. Compare the steps with
the public [screenshot tutorial](https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/tutorial)
and [video walkthrough](https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/walkthrough.html).
Record transaction hashes and verify them on the same network when reviewing
actual submissions; screenshots and video are separate demonstration evidence.
The Playwright-generated tutorial walkthrough uses simulated wallet and
transaction responses. It illustrates the interface, not a live Preprod
submission; actual chain behavior should be supported by separate transaction
records and explorer links.

**Current testnet limitation:** the frontend currently maps `addr_test1...`
addresses to the label `Testnet`, but the installed Lucid library expects
`Preprod` or `Preview`. That mapping must be corrected before this local route
can be treated as a working end-to-end Preprod transaction test. Configuring a
Blockfrost key resolves the missing-key error, not this separate network mismatch.
See [Frontend Blockfrost setup](./docs/milestone-5/frontend-blockfrost-setup.md)
for the configuration checks and limitation.

The hosted GitHub Pages build cannot read your local `.env` and has no runtime
API-key entry field. Use the local build for your own credentials. This route is
not a security-audit claim or an invitation to use real funds.

For a separate, key-free contract check, run the existing emulator suite from
the repository root:

```bash
cd agora-expansion
npm ci
npm run build
npm test
```

Emulator results do not by themselves prove that a hosted deployment or a live
wallet transaction succeeded.

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

## Milestone 5 documentation

GitBook-style milestone documentation lives in:

- [Repository and frontend setup](./docs/milestone-5/repository-and-frontend-setup.md)
- [Frontend Blockfrost setup](./docs/milestone-5/frontend-blockfrost-setup.md)
- [UI walkthrough](./docs/milestone-5/ui-walkthrough.md)
- [Launch materials](./docs/milestone-5/launch-materials.md)

## Evidence to include in PoA

For final proof-of-achievement, include:

- Link to the public repository commit or release containing the UI and documentation.
- Link to the deployed GUI: https://adaocommunity.github.io/AgoraExpansion/
- Screenshots or video showing wallet connection, configuration, lock, and redeem flow.
- Blockfrost setup notes so reviewers can reproduce wallet asset loading.
- Live transaction links if non-mocked chain evidence is required.

## Current closeout notes

Wallet icon 404s and final visual polish can be handled as closeout UI work. They do not change the Blockfrost configuration requirement or the setup flow above.
