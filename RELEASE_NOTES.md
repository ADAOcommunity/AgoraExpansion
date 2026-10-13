# AgoraExpansion v1.0.0

AgoraExpansion provides Cardano communities with validators, off-chain transaction
building, and a browser interface for using NFTs and fungible tokens as governance
voting power. The workflow configures eligible assets, locks selected assets, mints
voting power and a receipt token, and redeems the original assets.

## Included in this release

- Validators and off-chain lock and redeem transaction logic.
- React interface for configuration, wallet connection, locking, and redemption.
- Eternl, Lace, and Yoroi CIP-30 wallet options.
- Deployment-aware wallet-logo paths and their regression test.
- Repository setup, Blockfrost configuration, and workflow documentation.
- Public developer tutorial, screenshots, and a separate video walkthrough.
- Frontend package version aligned with the `v1.0.0` source release.

## Documentation and access

- Repository: https://github.com/ADAOcommunity/AgoraExpansion
- Interface: https://adaocommunity.github.io/AgoraExpansion/
- Developer documentation: https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/
- Tutorial: https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/tutorial
- Video walkthrough: https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/walkthrough.html

## Configuration and testing

The static frontend requires a matching Blockfrost project ID at build time.
Follow the README and developer documentation to configure your own local build
and wallet network. The default testnet endpoint is Cardano Preprod. Use testnet
assets for evaluation and do not commit API keys or wallet credentials.

This release publishes the existing implementation and its documentation. It does
not claim a security audit, an independently configured Preview deployment, or a
funded public Mainnet service.

## Release publication

Merging the release preparation into the upstream `main` branch triggers frontend
tests, a production build, and release-publisher tests. Successful validation is
followed by creation of the annotated `v1.0.0` tag on that merge's commit and
publication of these notes as the GitHub Release description.
