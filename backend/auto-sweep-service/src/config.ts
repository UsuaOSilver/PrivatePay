import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Network
  rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  chainId: parseInt(process.env.CHAIN_ID || '84532'),

  // Contracts
  deployerAddress: process.env.DEPLOYER_ADDRESS || '',
  usdcAddress: process.env.USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',

  // Relayer
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || '',
  relayerAddress: process.env.RELAYER_ADDRESS || '',

  // Fee configuration
  feeAmountUsdc: process.env.FEE_AMOUNT_USDC || '0.5',
  feeRecipient: process.env.FEE_RECIPIENT || '',

  // Database
  databasePath: process.env.DATABASE_PATH || './auto_sweep.db',

  // Monitoring
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
  minBalanceToSweep: '1000000', // 1 USDC in 6 decimals
};

// Validation
if (!config.deployerAddress) {
  console.warn('⚠️  DEPLOYER_ADDRESS not set in .env');
}

if (!config.relayerPrivateKey) {
  console.warn('⚠️  RELAYER_PRIVATE_KEY not set in .env');
}

if (!config.feeRecipient) {
  console.warn('⚠️  FEE_RECIPIENT not set in .env');
}
