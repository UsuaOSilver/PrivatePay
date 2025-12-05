import { WalletDatabase } from './database.js';
import { BalanceMonitor } from './monitor.js';
import { SweepRelayer } from './relayer.js';
import { config } from './config.js';

class AutoSweepService {
  private database: WalletDatabase;
  private monitor: BalanceMonitor;
  private relayer: SweepRelayer;
  private isRunning: boolean = false;

  constructor() {
    console.log('🪙 Coinflip Auto-Sweep Service');
    console.log('================================\n');

    this.database = new WalletDatabase();
    this.monitor = new BalanceMonitor(this.database);
    this.relayer = new SweepRelayer(this.database);
  }

  async start() {
    console.log('🚀 Starting auto-sweep service...\n');

    // Display configuration
    console.log('📋 Configuration:');
    console.log(`   Network: Base Sepolia (Chain ID: ${config.chainId})`);
    console.log(`   RPC: ${config.rpcUrl}`);
    console.log(`   Deployer: ${config.deployerAddress}`);
    console.log(`   USDC: ${config.usdcAddress}`);
    console.log(`   Relayer: ${this.relayer.getAddress()}`);
    console.log(`   Poll interval: ${config.pollIntervalMs}ms`);
    console.log(`   Min balance to sweep: ${Number(config.minBalanceToSweep) / 1_000_000} USDC\n`);

    // Check relayer balance
    await this.relayer.checkRelayerBalance();

    // Display stats
    const stats = this.database.getStats();
    console.log(`\n📊 Database stats:`);
    console.log(`   Total wallets: ${stats.totalWallets}`);
    console.log(`   Total sweeps: ${stats.totalSweeps}\n`);

    // Start monitoring loop
    this.isRunning = true;
    this.monitorLoop();
  }

  private async monitorLoop() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.monitor.getCurrentBlock();
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] 🔍 Block ${currentBlock} - Scanning wallets...`);

        // Scan for wallets with balance
        const walletsWithBalance = await this.monitor.scanWallets();

        if (walletsWithBalance.length > 0) {
          console.log(`\n🎯 Found ${walletsWithBalance.length} wallet(s) to sweep`);
          await this.relayer.processSweeps(walletsWithBalance);
          console.log(`\n✨ Sweep batch complete!`);
        }

        // Wait for next poll
        await new Promise(resolve => setTimeout(resolve, config.pollIntervalMs));
      } catch (error) {
        console.error(`\n❌ Error in monitor loop:`, error);
        // Wait a bit longer on error
        await new Promise(resolve => setTimeout(resolve, config.pollIntervalMs * 2));
      }
    }
  }

  stop() {
    console.log('\n⏹️  Stopping auto-sweep service...');
    this.isRunning = false;
    this.database.close();
  }

  // Add wallet for monitoring (called by API)
  addWallet(address: string, owner: string, salt: string): void {
    this.database.addWallet(address, owner, salt);
    console.log(`➕ Added wallet ${address} to monitoring`);
  }

  // Remove wallet from monitoring
  removeWallet(address: string): void {
    this.database.removeWallet(address);
    console.log(`➖ Removed wallet ${address} from monitoring`);
  }

  // Get wallet history
  getWalletHistory(address: string) {
    return this.database.getSweepHistory(address);
  }

  // Get owner wallets
  getOwnerWallets(owner: string) {
    return this.database.getOwnerWallets(owner);
  }
}

// Create and start service
const service = new AutoSweepService();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📥 Received SIGINT signal');
  service.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n📥 Received SIGTERM signal');
  service.stop();
  process.exit(0);
});

// Start the service
service.start().catch((error) => {
  console.error('❌ Failed to start service:', error);
  process.exit(1);
});

export { AutoSweepService };
