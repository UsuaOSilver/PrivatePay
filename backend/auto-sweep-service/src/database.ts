import Database from 'better-sqlite3';
import { config } from './config.js';

export interface AutoSweepWallet {
  address: string;
  owner: string;
  salt: string;
  createdAt: number;
  lastChecked: number;
  sweepCount: number;
}

export interface SweepHistory {
  id: number;
  walletAddress: string;
  txHash: string;
  amount: string;
  timestamp: number;
  recipient: string;
}

export class WalletDatabase {
  private db: Database.Database;

  constructor(dbPath: string = config.databasePath) {
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables() {
    // Auto-sweep wallets table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS auto_sweep_wallets (
        address TEXT PRIMARY KEY,
        owner TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_checked INTEGER NOT NULL,
        sweep_count INTEGER DEFAULT 0
      )
    `);

    // Sweep history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sweep_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        amount TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        recipient TEXT NOT NULL,
        FOREIGN KEY (wallet_address) REFERENCES auto_sweep_wallets(address)
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_owner ON auto_sweep_wallets(owner);
      CREATE INDEX IF NOT EXISTS idx_last_checked ON auto_sweep_wallets(last_checked);
      CREATE INDEX IF NOT EXISTS idx_wallet_address ON sweep_history(wallet_address);
    `);
  }

  // Add wallet for auto-sweep monitoring
  addWallet(address: string, owner: string, salt: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO auto_sweep_wallets (address, owner, salt, created_at, last_checked)
      VALUES (?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    stmt.run(address, owner, salt, now, now);
  }

  // Get all wallets that need checking
  getWalletsToCheck(limit: number = 100): AutoSweepWallet[] {
    const stmt = this.db.prepare(`
      SELECT
        address,
        owner,
        salt,
        created_at as createdAt,
        last_checked as lastChecked,
        sweep_count as sweepCount
      FROM auto_sweep_wallets
      ORDER BY last_checked ASC
      LIMIT ?
    `);
    return stmt.all(limit) as AutoSweepWallet[];
  }

  // Update last checked timestamp
  updateLastChecked(address: string): void {
    const stmt = this.db.prepare(`
      UPDATE auto_sweep_wallets
      SET last_checked = ?
      WHERE address = ?
    `);
    stmt.run(Date.now(), address);
  }

  // Record successful sweep
  recordSweep(walletAddress: string, txHash: string, amount: string, recipient: string): void {
    // Insert sweep history
    const historyStmt = this.db.prepare(`
      INSERT INTO sweep_history (wallet_address, tx_hash, amount, timestamp, recipient)
      VALUES (?, ?, ?, ?, ?)
    `);
    historyStmt.run(walletAddress, txHash, amount, Date.now(), recipient);

    // Increment sweep count
    const countStmt = this.db.prepare(`
      UPDATE auto_sweep_wallets
      SET sweep_count = sweep_count + 1, last_checked = ?
      WHERE address = ?
    `);
    countStmt.run(Date.now(), walletAddress);
  }

  // Get sweep history for a wallet
  getSweepHistory(walletAddress: string): SweepHistory[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        wallet_address as walletAddress,
        tx_hash as txHash,
        amount,
        timestamp,
        recipient
      FROM sweep_history
      WHERE wallet_address = ?
      ORDER BY timestamp DESC
    `);
    return stmt.all(walletAddress) as SweepHistory[];
  }

  // Get all wallets for an owner
  getOwnerWallets(owner: string): AutoSweepWallet[] {
    const stmt = this.db.prepare(`
      SELECT
        address,
        owner,
        salt,
        created_at as createdAt,
        last_checked as lastChecked,
        sweep_count as sweepCount
      FROM auto_sweep_wallets
      WHERE owner = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(owner) as AutoSweepWallet[];
  }

  // Remove wallet from monitoring
  removeWallet(address: string): void {
    this.db.prepare('DELETE FROM auto_sweep_wallets WHERE address = ?').run(address);
  }

  // Get statistics
  getStats(): { totalWallets: number; totalSweeps: number } {
    const walletCount = this.db.prepare('SELECT COUNT(*) as count FROM auto_sweep_wallets').get() as { count: number };
    const sweepCount = this.db.prepare('SELECT COUNT(*) as count FROM sweep_history').get() as { count: number };
    return {
      totalWallets: walletCount.count,
      totalSweeps: sweepCount.count,
    };
  }

  close(): void {
    this.db.close();
  }
}
