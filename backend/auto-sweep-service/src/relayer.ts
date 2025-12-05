import { ethers } from 'ethers';
import { config } from './config.js';
import { WalletDatabase } from './database.js';

const DEPLOYER_ABI = [
  'function deployAndSweepERC20(bytes32 salt, address token, address recipient) returns (address wallet)',
];

export class SweepRelayer {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private deployerContract: ethers.Contract;
  private database: WalletDatabase;

  constructor(database: WalletDatabase) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.relayerPrivateKey, this.provider);
    this.deployerContract = new ethers.Contract(config.deployerAddress, DEPLOYER_ABI, this.wallet);
    this.database = database;
  }

  // Execute sweep for a burner wallet
  async sweep(burnerAddress: string, salt: string, recipient: string): Promise<string> {
    try {
      console.log(`🔄 Initiating sweep for ${burnerAddress}`);
      console.log(`   Salt: ${salt}`);
      console.log(`   Recipient: ${recipient}`);

      // Convert salt to bytes32
      const saltBytes32 = ethers.zeroPadValue(salt, 32);

      // Estimate gas
      const gasEstimate = await this.deployerContract.deployAndSweepERC20.estimateGas(
        saltBytes32,
        config.usdcAddress,
        recipient
      );

      console.log(`   Estimated gas: ${gasEstimate.toString()}`);

      // Execute sweep with 20% gas buffer
      const tx = await this.deployerContract.deployAndSweepERC20(
        saltBytes32,
        config.usdcAddress,
        recipient,
        {
          gasLimit: (gasEstimate * 120n) / 100n,
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);

      // Wait for transaction
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`✅ Sweep successful!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        return tx.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error(`❌ Sweep failed for ${burnerAddress}:`, error);
      throw error;
    }
  }

  // Process multiple sweeps
  async processSweeps(
    wallets: Array<{ address: string; owner: string; salt: string; balance: bigint }>
  ): Promise<void> {
    for (const wallet of wallets) {
      try {
        const balanceUsdc = Number(wallet.balance) / 1_000_000;
        console.log(`\n💫 Processing sweep ${wallets.indexOf(wallet) + 1}/${wallets.length}`);
        console.log(`   Wallet: ${wallet.address}`);
        console.log(`   Balance: ${balanceUsdc} USDC`);

        const txHash = await this.sweep(wallet.address, wallet.salt, wallet.owner);

        // Record in database
        this.database.recordSweep(
          wallet.address,
          txHash,
          wallet.balance.toString(),
          wallet.owner
        );

        console.log(`   ✅ Recorded in database`);

        // Wait a bit between sweeps to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`   ❌ Failed to process wallet ${wallet.address}`);
      }
    }
  }

  // Check relayer balance
  async checkRelayerBalance(): Promise<void> {
    const balance = await this.provider.getBalance(this.wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`💼 Relayer balance: ${balanceEth} ETH`);

    if (balance < ethers.parseEther('0.01')) {
      console.warn(`⚠️  Low relayer balance! Please fund ${this.wallet.address}`);
    }
  }

  // Get relayer address
  getAddress(): string {
    return this.wallet.address;
  }
}
