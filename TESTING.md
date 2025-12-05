# User Testing Guide: Not-So-Private Transfers

This guide will walk you through testing the complete flow of the Not-So-Private Transfers application, both locally with Anvil and on the Sepolia testnet.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Testing with Anvil](#local-testing-with-anvil)
- [Testnet Testing with Sepolia](#testnet-testing-with-sepolia)
- [Expected Behaviors](#expected-behaviors)
- [Troubleshooting](#troubleshooting)
- [Video Walkthrough](#video-walkthrough)

---

## Prerequisites

### Required Software

1. **Rust** (1.70.0 or later)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Foundry** (for Solidity development)
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

3. **Node.js** (v18 or later)
   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   ```

4. **pnpm** (recommended) or npm
   ```bash
   npm install -g pnpm
   ```

### Required Tools

- **MetaMask** or another Web3 wallet (browser extension)
- **Test ETH** (for Sepolia testnet testing)
  - Get from [Sepolia Faucet](https://sepoliafaucet.com/)
  - Or [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

---

## Local Testing with Anvil

### Step 1: Clone and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/UsuaOSilver/not-so-private-addr.git
   cd not-so-private-addr
   ```

2. **Install Solidity dependencies**
   ```bash
   cd contracts
   forge install
   cd ..
   ```

3. **Install Rust dependencies**
   ```bash
   cargo build
   ```

4. **Install Frontend dependencies**
   ```bash
   cd frontend
   pnpm install  # or: npm install
   cd ..
   ```

### Step 2: Start Local Blockchain (Anvil)

Open a new terminal and start Anvil:

```bash
anvil
```

**Expected Output:**
```
                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ \  \ \ / / | | | |
    | (_| | | | | |  \ V /  | | | |
     \__,_| |_| |_|   \_/   |_| |_|

    0.2.0 (abcd1234 2024-01-01T00:00:00.000000000Z)

Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...

Listening on 127.0.0.1:8545
```

**⚠️ Important:** Keep this terminal open. Copy one of the private keys for later use.

### Step 3: Deploy Smart Contracts

In a new terminal:

```bash
cd contracts

# Deploy to local Anvil
forge script script/Protocol.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Expected Output:**
```
...
== Logs ==
Deployer deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
```

**⚠️ Important:** Note the Deployer contract address. You'll need to update `contracts/deployments.json`:

```json
{
  "31337": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}
```

Replace `31337` with the chain ID shown by Anvil (usually 31337 for local) and the address with your deployed Deployer contract.

### Step 4: Start Backend API

In a new terminal:

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env to set:
# RPC_URL=http://localhost:8545
# PORT=3001
# DEPLOYMENTS_PATH=../contracts/deployments.json

# Run the backend
cargo run
```

**Expected Output:**
```
INFO  backend: Connecting to RPC: http://localhost:8545
INFO  backend: Connected to chain ID: 31337
INFO  backend: Loaded deployment configuration
INFO  backend: Starting server on 0.0.0.0:3001
```

**⚠️ Important:** Keep this terminal open.

### Step 5: Start Frontend

In a new terminal:

```bash
cd frontend

# Create .env.local file
cp .env.example .env.local

# Edit .env.local to set:
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Run the frontend
pnpm dev  # or: npm run dev
```

**Expected Output:**
```
   ▲ Next.js 14.2.18
   - Local:        http://localhost:3000

 ✓ Ready in 2.3s
```

### Step 6: Configure MetaMask for Local Network

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name:** Anvil Local
   - **RPC URL:** http://localhost:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
4. Click "Save"
5. Switch to the Anvil Local network

### Step 7: Import Anvil Account

1. In MetaMask, click account icon → "Import Account"
2. Paste one of the Anvil private keys:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click "Import"
4. You should see ~10000 ETH balance

### Step 8: Test the Complete Flow

1. **Open the App**
   - Navigate to http://localhost:3000
   - Click "Connect Wallet" and connect with MetaMask

2. **Generate Burner Address**
   - Click "Generate Burner Address"
   - A deterministic address will be created
   - Copy the burner address (or scan QR code)

3. **Fund the Burner Address**
   - Open MetaMask
   - Click "Send"
   - Paste the burner address
   - Send 1 ETH
   - Confirm transaction

4. **Check Balance**
   - Back in the app, click "Check Balance" or "Auto-Check (5s)"
   - Once funds are detected, you'll move to Step 3

5. **Deploy & Sweep**
   - Enter the **Owner Private Key** (the same one you imported to MetaMask)
   - Verify the **Recipient Address** (should be pre-filled with your MetaMask address)
   - Click "Deploy & Sweep Funds"
   - Confirm the transaction in MetaMask (if prompted)

6. **Success!**
   - You should see the transaction hash
   - Check MetaMask - your balance should have increased (minus gas)
   - The burner wallet is now deployed and empty

### Step 9: Verify on Blockchain

```bash
# Check the burner wallet balance (should be 0)
cast balance <BURNER_ADDRESS> --rpc-url http://localhost:8545

# Check your recipient balance
cast balance <YOUR_ADDRESS> --rpc-url http://localhost:8545

# Get transaction receipt
cast receipt <TX_HASH> --rpc-url http://localhost:8545
```

---

## Testnet Testing with Sepolia

### Step 1: Get Sepolia ETH

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Request test ETH
4. Wait for confirmation (usually 1-2 minutes)

### Step 2: Deploy Contracts to Sepolia

```bash
cd contracts

# Deploy to Sepolia (you'll need a Sepolia RPC URL)
forge script script/Protocol.s.sol \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast \
  --verify  # Optional: verify on Etherscan
```

**Update `contracts/deployments.json`:**
```json
{
  "11155111": "0xYourDeployerAddressOnSepolia"
}
```

### Step 3: Start Backend with Sepolia RPC

```bash
cd backend

# Update .env:
# RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# PORT=3001
# DEPLOYMENTS_PATH=../contracts/deployments.json

cargo run
```

### Step 4: Start Frontend

```bash
cd frontend

# .env.local should have:
# NEXT_PUBLIC_API_URL=http://localhost:3001

pnpm dev
```

### Step 5: Configure MetaMask for Sepolia

1. MetaMask → Network dropdown
2. Select "Sepolia Test Network" (or add it manually if not listed)

### Step 6: Test on Sepolia

Follow the same flow as local testing (Step 8 above), but:
- Transactions will take longer (12-15 seconds per block)
- You'll need real Sepolia ETH for gas
- Auto-check polling is useful here
- You can verify transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

---

## Expected Behaviors

### ✅ Successful Flow

1. **Address Generation**
   - Address starts with `0x`
   - Salt is generated (32-byte hex)
   - Address is deterministic (same salt + owner = same address)

2. **Funding**
   - Balance updates when funds arrive
   - QR code displays correctly
   - Auto-check detects funds within 5 seconds

3. **Deployment & Sweep**
   - Transaction is submitted successfully
   - Funds are transferred to recipient
   - Burner wallet balance becomes 0
   - Gas is paid by the transaction sender

4. **Transaction Receipt**
   - Status is "success"
   - `Deployed` event is emitted with wallet address
   - Wallet code exists at burner address (briefly, before sweep)

### ❌ Common Errors

1. **"Invalid owner address"**
   - Make sure wallet is connected
   - Address should start with `0x`

2. **"Wallet has no funds to sweep"**
   - Burner address hasn't received funds yet
   - Check balance first

3. **"Invalid private key"**
   - Private key must match the owner address used to generate burner
   - Format: `0x...` (64 hex characters after 0x)

4. **"Failed to sign authentication"**
   - Private key doesn't match owner
   - Check that you're using the correct private key

5. **"No deployment found for chain ID"**
   - Contracts haven't been deployed to this chain
   - Check `deployments.json`
   - Verify backend is connected to correct RPC

6. **"Failed to get balance"**
   - RPC connection issue
   - Check backend logs
   - Verify RPC URL in backend .env

---

## Troubleshooting

### Backend Issues

**Problem:** Backend won't start
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Use a different port
PORT=3002 cargo run
```

**Problem:** "Failed to load deployments config"
```bash
# Verify file exists
cat contracts/deployments.json

# Check file path in .env
echo $DEPLOYMENTS_PATH
```

### Frontend Issues

**Problem:** Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm dev
```

**Problem:** "Failed to connect to API"
```bash
# Verify backend is running
curl http://localhost:3001/health

# Check CORS settings in backend
```

### Contract Issues

**Problem:** "Deployment failed"
```bash
# Check Anvil is running
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# Check account has ETH
cast balance <YOUR_ADDRESS> --rpc-url http://localhost:8545
```

**Problem:** "Transaction reverted"
```bash
# Get detailed error
cast run <TX_HASH> --rpc-url http://localhost:8545 --trace
```

### MetaMask Issues

**Problem:** Transaction stuck/pending
- Speedup or cancel in MetaMask
- Reset account: Settings → Advanced → Reset Account

**Problem:** Wrong network
- Verify you're on the correct network
- Check chain ID matches (31337 for Anvil, 11155111 for Sepolia)

---

## Advanced Testing Scenarios

### Scenario 1: Multiple Burner Wallets

Test creating multiple burner addresses:
1. Generate burner address #1
2. Generate burner address #2 (different salt)
3. Fund both
4. Sweep both to same recipient

**Expected:** Each has unique address, both sweep successfully

### Scenario 2: Reusing Salt

Test deterministic address generation:
1. Generate address with wallet A
2. Note the burner address
3. Refresh page
4. Generate address again with wallet A
5. Should NOT be the same address (random salt)

### Scenario 3: Partial Sweep

Test sweeping when gas costs matter:
1. Fund burner with small amount (0.01 ETH)
2. Sweep to recipient
3. Check gas costs consumed significant portion

### Scenario 4: Front-Running Protection

Test authentication replay protection:
1. Deploy and sweep
2. Try to replay same authentication signature
3. Should fail with "AuthenticationAlreadyUsed"

---

## Success Criteria

✅ **Core Functionality**
- [ ] Can generate deterministic burner addresses
- [ ] Can receive funds at undeployed address
- [ ] Can check balance of burner address
- [ ] Can deploy and sweep in single transaction
- [ ] Funds arrive at recipient address

✅ **UX**
- [ ] Wallet connects smoothly
- [ ] QR code displays correctly
- [ ] Balance updates in real-time
- [ ] Transaction status is clear
- [ ] Error messages are helpful

✅ **Security**
- [ ] Private keys are not logged
- [ ] Signatures can't be replayed
- [ ] Only owner can sweep funds
- [ ] Contracts deploy to correct addresses

✅ **Performance**
- [ ] Address generation < 1 second
- [ ] Balance checks < 2 seconds
- [ ] Deploy transaction < 30 seconds (local) / < 60 seconds (testnet)

---

## Video Walkthrough

*TODO: Add link to video walkthrough once recorded*

### Recording Your Own Walkthrough

1. **Screen Recording Tools:**
   - macOS: QuickTime, OBS
   - Windows: OBS, ShareX
   - Linux: SimpleScreenRecorder, OBS

2. **What to Record:**
   - Starting Anvil
   - Deploying contracts
   - Starting backend and frontend
   - Complete user flow (generate → fund → sweep)
   - Verification on blockchain

3. **Tips:**
   - Use 1920x1080 resolution
   - Zoom in on important details
   - Narrate each step
   - Show terminal outputs
   - Demonstrate both success and error cases

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Logs:**
   - Backend: Terminal running `cargo run`
   - Frontend: Browser console (F12)
   - Contracts: Foundry test output

2. **Common Resources:**
   - [Foundry Book](https://book.getfoundry.sh/)
   - [Alloy Documentation](https://alloy-rs.github.io/alloy/)
   - [Next.js Documentation](https://nextjs.org/docs)
   - [RainbowKit Docs](https://www.rainbowkit.com/)

3. **Community:**
   - Open an issue on GitHub
   - Ask in project Discord/Telegram (if available)

---

## Next Steps

After successful testing:

1. **Deploy to Production:**
   - Get contracts audited
   - Deploy to mainnet
   - Set up production infrastructure

2. **Enhancements:**
   - Add support for ERC20 tokens
   - Implement batching for multiple sweeps
   - Add ENS support for recipient addresses
   - Create mobile-friendly UI

3. **Documentation:**
   - Write architecture deep-dive
   - Create API documentation
   - Add inline code comments
   - Build developer documentation

---

**Happy Testing! 🚀**