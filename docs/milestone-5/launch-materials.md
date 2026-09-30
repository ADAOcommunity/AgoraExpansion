# Launch Materials

## Summary

AgoraExpansion extends Agora-style Cardano governance by allowing NFTs and fungible tokens to contribute to configurable voting power.

Public links:

- Repository: https://github.com/ADAOcommunity/AgoraExpansion
- GUI: https://adaocommunity.github.io/AgoraExpansion/

## GitHub Update Template

```markdown
## Milestone 5 Update

AgoraExpansion is ready for broader Cardano community review.

This update includes:

- Public repository and deployed GUI.
- Frontend setup and Blockfrost configuration instructions.
- Wallet connection and UI workflow documentation.
- Launch materials for community announcement, tutorial video, and AMA/webinar.

Links:

- Repository: https://github.com/ADAOcommunity/AgoraExpansion
- GUI: https://adaocommunity.github.io/AgoraExpansion/
```

## Community Announcement

AgoraExpansion is preparing for launch. The project expands Cardano governance by supporting NFT and FT based voting power, asset locking, and receipt NFT redemption through a public UI.

Developers and community members can review the repository, run the frontend locally, configure Blockfrost, and test the user flow with a supported Cardano wallet.

## Webinar Or AMA Outline

1. Project context and problem statement.
2. NFT and FT voting power model.
3. Repository architecture.
4. Frontend wallet and Blockfrost setup.
5. UI walkthrough: connect, configure, generate, redeem.
6. Evidence, limitations, and closeout items.
7. Community Q&A.

## Instructional Video Outline

1. Show the public repository.
2. Explain `agora-expansion` and `agora-expansion-fe`.
3. Copy `.env.example` to `.env`.
4. Add Blockfrost project IDs.
5. Run `npm start`.
6. Connect a wallet.
7. Configure voting power.
8. Generate voting power by locking assets.
9. Redeem a receipt NFT.

## Closeout Notes

Wallet icon 404s and final visual polish are tracked as closeout UI work. They should be fixed before final public promotion, but the documentation now explains the required Blockfrost setup that prevents wallet asset loading confusion.
