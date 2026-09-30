# Repository And Frontend Setup

This guide explains how to build and run AgoraExpansion locally.

## Clone

```powershell
git clone https://github.com/ADAOcommunity/AgoraExpansion.git
cd AgoraExpansion
```

## Off-Chain Package

The off-chain package contains validator-adjacent transaction helpers and emulator tests.

```powershell
cd agora-expansion
npm install
npm run build
npm run test
```

Important files:

- `validators/governance-token.ak`
- `src/index.ts`
- `src/test.ts`

## Frontend Package

The frontend is a React app created with Create React App.

```powershell
cd agora-expansion-fe
npm install
Copy-Item .env.example .env
npm start
```

Open:

```text
http://localhost:3000
```

Production build:

```powershell
npm run build
```

The output is written to:

```text
agora-expansion-fe/build
```

## Deployed GUI

The public GUI is deployed at:

https://adaocommunity.github.io/AgoraExpansion/

The GUI requires a supported CIP-30 browser wallet and Blockfrost API configuration for wallet asset loading.
