import { render, screen } from '@testing-library/react';
import WalletConnect from './WalletConnect';

jest.mock('../services/lucidService', () => ({
  LucidService: {
    isHexAddress: jest.fn(),
    hexToBech32: jest.fn(),
  },
}));

const originalPublicUrl = process.env.PUBLIC_URL;

afterEach(() => {
  if (originalPublicUrl === undefined) {
    delete process.env.PUBLIC_URL;
  } else {
    process.env.PUBLIC_URL = originalPublicUrl;
  }
});

test('uses the deployment public path for wallet logos', () => {
  process.env.PUBLIC_URL = '/AgoraExpansion';

  render(<WalletConnect onConnect={jest.fn()} />);

  const logos = [
    ['Eternl', 'eternl.svg'],
    ['Lace', 'lace.svg'],
    ['Yoroi', 'yoroi.svg'],
  ];

  logos.forEach(([wallet, fileName]) => {
    expect(screen.getByRole('img', { name: wallet }).getAttribute('src')).toBe(
      `/AgoraExpansion/${fileName}`
    );
  });
});
