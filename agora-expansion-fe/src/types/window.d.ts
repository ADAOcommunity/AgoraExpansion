interface CardanoAPI {
  enable: () => Promise<any>;
}

interface Cardano {
  nami: CardanoAPI;
  // Add other wallets as needed
}

declare global {
  interface Window {
    cardano?: Cardano;
  }
}

export {}; 