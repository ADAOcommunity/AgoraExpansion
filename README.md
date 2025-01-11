# AgoraExpansion
Repository to house new validators and off-chain code for leveraging Agora with NFTs instead of FTs.

The repository now contains a multi-validator in `agora-expansion/validators/governance-token.ak`, the multivalidator contains both the capability of minting the token representing voting power, and also a 'locker' which contains the NFTs and FTs used to generate voting power. A user locks their tokens in order to mint an alternative token used for voting as described in the research in the `ResearchPhase` directory, in addition to the voting power token, a receipt is minted to allow for the users NFTs to be claimed when burning the correct amount of the voting power token.

The repository also contains off-chain transaction building code in `agora-expansion/src/index.ts` and emulator testing code in `agora-expansion/src/test.ts`

The user can verify the test suite by running 

```
npm install
npm run test
```

in the `agora-expansion` directory. This assumes that the user has npm installed locally.