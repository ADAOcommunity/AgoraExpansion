import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletConnect from './WalletConnect';

jest.mock('../services/lucidService', () => ({
  LucidService: {
    isHexAddress: jest.fn(),
    hexToBech32: jest.fn(),
  },
}));

const originalPublicUrl = process.env.PUBLIC_URL;
const originalTestnetKey = process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY;
const originalMainnetKey = process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY;

beforeEach(() => {
  delete process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY;
  delete process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY;
});

afterEach(() => {
  if (originalPublicUrl === undefined) {
    delete process.env.PUBLIC_URL;
  } else {
    process.env.PUBLIC_URL = originalPublicUrl;
  }
  if (originalTestnetKey === undefined) {
    delete process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY;
  } else {
    process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY = originalTestnetKey;
  }
  if (originalMainnetKey === undefined) {
    delete process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY;
  } else {
    process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY = originalMainnetKey;
  }
});

test('shows configuration requirements and documentation before wallet connection', () => {
  render(<WalletConnect onConnect={jest.fn()} />);

  expect(screen.getByRole('heading', { name: 'Before connecting' })).toBeInTheDocument();
  expect(screen.getByText(/Wallet connection does not supply an API key/)).toBeInTheDocument();
  expect(screen.getByText(/A wallet alone is not enough/)).toBeInTheDocument();
  expect(screen.getByText(/This page does not provide test assets/)).toBeInTheDocument();
  expect(screen.getByText(/Do not use real funds/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Tutorial and screenshots' })).toHaveAttribute(
    'href',
    'https://agora-expansion-tutorial.late-fog-e5ce.workers.dev/tutorial'
  );
  expect(screen.getByRole('link', { name: 'Local setup guide' })).toHaveAttribute(
    'href',
    'https://github.com/ADAOcommunity/AgoraExpansion/blob/main/docs/milestone-5/frontend-blockfrost-setup.md'
  );
});

test('does not offer a dead-end connection when both provider keys are missing', () => {
  const onConnect = jest.fn();
  render(<WalletConnect onConnect={onConnect} />);

  expect(screen.getByRole('status')).toHaveTextContent('this build has no Blockfrost key');
  ['Eternl', 'Lace', 'Yoroi'].forEach((wallet) => {
    const button = screen.getByRole('button', { name: new RegExp(wallet) });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-describedby', 'wallet-configuration-status');
    fireEvent.click(button);
  });
  expect(onConnect).not.toHaveBeenCalled();
});

test('treats whitespace-only provider keys as missing', () => {
  process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY = '   ';
  process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY = '\t';
  render(<WalletConnect onConnect={jest.fn()} />);

  expect(screen.getByRole('button', { name: /Eternl/ })).toBeDisabled();
});

test.each([
  ['REACT_APP_BLOCKFROST_TESTNET_API_KEY', 'Testnet'],
  ['REACT_APP_BLOCKFROST_MAINNET_API_KEY', 'Mainnet'],
])('permits connection when %s is supplied without claiming the key is valid', (key, provider) => {
  process.env[key] = 'example-project-id';
  render(<WalletConnect onConnect={jest.fn()} />);

  expect(screen.getByRole('status')).toHaveTextContent(`Keys supplied for: ${provider}`);
  expect(screen.getByRole('status')).toHaveTextContent('Key validity and transaction readiness are not verified');
  ['Eternl', 'Lace', 'Yoroi'].forEach((wallet) => {
    expect(screen.getByRole('button', { name: new RegExp(wallet) })).toBeEnabled();
  });
});

test('lists both supplied providers without exposing their keys', () => {
  process.env.REACT_APP_BLOCKFROST_TESTNET_API_KEY = 'private-testnet-value';
  process.env.REACT_APP_BLOCKFROST_MAINNET_API_KEY = 'private-mainnet-value';
  render(<WalletConnect onConnect={jest.fn()} />);

  expect(screen.getByRole('status')).toHaveTextContent('Keys supplied for: Testnet, Mainnet');
  expect(screen.queryByText(/private-testnet-value|private-mainnet-value/)).not.toBeInTheDocument();
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
