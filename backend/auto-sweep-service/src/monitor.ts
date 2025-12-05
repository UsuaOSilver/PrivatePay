import { ethers } from 'ethers';
import { config } from './config.js';
import { WalletDatabase } from './database.js';

const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export class BalanceMonitor {
  private provider: ethers.JsonRpcProvider;
  private usdcContract: ethers.Contract;
  private database: WalletDatabase;

  constructor(database: WalletDatabase) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.usdcContract = new ethers.Contract(config.usdcAddress, USDC_ABI, this.provider);
    this.database = database;
  }

  // Check USDC balance for an address
  async checkBalance(address: string): Promise<bigint> {
    try {
      const balance = await this.usdcContract.balanceOf(address);
      return BigInt(balance.toString());
    } catch (error) {
      console.error(`Error checking balance for ${address}:`, error);
      return 0n;
    }
  }

  // Monitor all wallets and return those with balance
  async scanWallets(): Promise<Array<{ address: string; owner: string; salt: string; balance: bigint }>> {
    const wallets = this.database.getWalletsToCheck(100);
    const walletsWithBalance: Array<{ address: string; owner: string; salt: string; balance: bigint }> = [];

    console.log(`📊 Scanning ${wallets.length} wallets for USDC balance...`);

    for (const wallet of wallets) {
      try {
        const balance = await this.checkBalance(wallet.address);

        // Update last checked timestamp
        this.database.updateLastChecked(wallet.address);

        // If balance is above minimum threshold, mark for sweep
        if (balance >= BigInt(config.minBalanceToSweep)) {
          const balanceUsdc = Number(balance) / 1_000_000; // Convert to USDC (6 decimals)
          console.log(`💰 Wallet ${wallet.address} has ${balanceUsdc} USDC`);
          walletsWithBalance.push({
            address: wallet.address,
            owner: wallet.owner,
            salt: wallet.salt,
            balance,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error scanning wallet ${wallet.address}:`, error);
      }
    }

    if (walletsWithBalance.length > 0) {
      console.log(`✅ Found ${walletsWithBalance.length} wallets ready for sweep`);
    } else {
      console.log(`⏳ No wallets with sufficient balance found`);
    }

    return walletsWithBalance;
  }

  // Get current block number
  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  // Get gas price
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }
}
