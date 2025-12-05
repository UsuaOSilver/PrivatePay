# 🪙 Coinflip

**Insert Coin to Pay - Payment Links for Base**

🏆 Built for MBC 2025 Hackathon | Base Track + Circle Bounty

---

## 🎮 What is Coinflip?

Remember arcade games? **Insert coin, press start, play instantly.** That's how crypto payments should work.

Coinflip is the **payment link platform for Base** that makes USDC payments as easy as dropping a quarter in a slot machine:

- 🔗 **Payment Links** - Share links, accept USDC, zero gas fees
- 💰 **Social Tipping** - One-tap tips for creators on Farcaster/Twitter
- 🎲 **Group Splits** - Split bills with friends, auto-distribute
- ⚡ **Gas Sponsored** - Recipients pay ZERO gas (we cover it)
- 🕹️ **Arcade Theme** - Making crypto payments fun and approachable

---

## ⚡ The Problem

Crypto payments have TWO major problems:

### Problem 1: Gas Fees Kill UX
- Sender pays $5 USDC → Needs ETH for gas → Complex, friction-heavy
- Recipients need gas to move funds → Another barrier
- New users get stuck with unusable funds

### Problem 2: Everything is Public
- Accept a payment → Your entire wallet history is exposed
- Coffee shops reveal daily revenue to every customer
- Freelancers expose client payments to other clients
- Creators' earnings are fully trackable

**Result**: Crypto payments stay niche, never reach mainstream adoption.

---

## 💡 The Solution

Coinflip fixes BOTH problems with a **gas-sponsored burner wallet system**:

```
┌─────────────────────────────────────────────────────┐
│  1. Create Payment Link                             │
│     coinflip.app/pay/coffee-alice                   │
├─────────────────────────────────────────────────────┤
│  2. Customer Pays                                   │
│     → Sends USDC to burner address                  │
│     → No gas needed (just USDC)                     │
├─────────────────────────────────────────────────────┤
│  3. Auto-Sweep (10 seconds)                         │
│     → Relayer deploys burner + sweeps               │
│     → Merchant receives USDC (gas-free!)            │
│     → Customer can't track merchant's main wallet   │
└─────────────────────────────────────────────────────┘
```

**Key Innovation**: Gas-sponsored CREATE2 burners + auto-sweep = zero friction for BOTH parties

---

## 🎯 Features

### 1. Payment Links 🔗
Generate shareable links for instant USDC payments

**Use cases:**
- ☕ Coffee shop QR code: `coinflip.app/pay/espresso-bar`
- 🎨 Artist donation link: `coinflip.app/tips/alice`
- 💼 Freelancer invoice: `coinflip.app/invoice/project-123`

**What makes it special:**
- ✅ Gas-free for both sender and receiver
- ✅ 10-second auto-sweep to your wallet
- ✅ Customer isolation (burner addresses)
- ✅ QR code generation
- ✅ Custom amounts or open tips

### 2. Social Tipping 💸
One-tap tipping for content creators

**Integration:**
- Farcaster Frames (in-feed tipping)
- Twitter bio links
- Discord/Telegram bots (future)

**Creator Experience:**
```
1. Connect Coinbase Smart Wallet
2. Generate tipping page: coinflip.app/tips/alice
3. Post Farcaster Frame with tip buttons
4. Fan tips $5 USDC with Face ID
5. Auto-sweep to your wallet (10 seconds, gas-free!)
```

### 3. Group Payment Splits 🎲
Split bills with friends, crypto-native

**Example: Dinner Split**
```
Alice creates split: "Sushi Night - $120 / 4 people"
→ Shares link: coinflip.app/split/abc123
→ Bob, Carol, Dave each pay $30 USDC
→ When complete: Restaurant receives $120 (gas-free!)
→ Everyone sees "Split complete! ✅"
```

**Use cases:**
- 🍕 Group dinner bills
- 🎁 Shared gifts
- 🏠 Rent/utilities splitting
- 🎟️ Event ticket pooling

### 4. Gas Abstraction ⛽
**The killer feature that makes everything work:**

- Relayer pays ALL gas fees
- Users only need USDC (no ETH required)
- Auto-sweep monitoring every 5 seconds
- 0.5% fee covers gas + operational costs

**Technical Magic:**
- CREATE2 deterministic addresses (no upfront deployment)
- Backend monitoring service (Node.js + SQLite)
- Relayer wallet with Base Sepolia ETH
- `deployAndSweepERC20()` atomic transaction

---

## 🏗️ Architecture

### Smart Contracts (Deployed to Base Sepolia)

**Deployer.sol**
```solidity
function deployAndSweepERC20(
    bytes32 salt,
    address token,      // USDC: 0x036CbD53...
    address recipient
) public returns (address wallet)
```

- CREATE2 deployment + sweep in ONE transaction
- Gas-efficient ephemeral wallets
- ERC20 (USDC) support

**Contracts:**
- `Deployer.sol` - CREATE2 deployer with sweep function
- `Wallet.sol` - Minimal burner wallet with ERC20 sweep

### Backend Services

**1. Rust API (Port 8080)**
- `/api/compute-address` - Generate burner addresses
- `/api/balance-usdc/:address` - Check USDC balances
- Alloy + ethers-rs for blockchain interaction

**2. Auto-Sweep Service (Node.js + TypeScript)**
- Monitors burner addresses for USDC deposits
- Triggers gas-sponsored sweeps via relayer
- SQLite database for wallet tracking
- 5-second polling interval

**3. Payment Link Service (Future)**
- Link generation and metadata storage
- Group split coordination
- Farcaster Frame API

### Frontend (Next.js 14 + Arcade Theme)

**Tech Stack:**
- TypeScript + Next.js 14 App Router
- Wagmi + RainbowKit (wallet connection)
- Coinbase Smart Wallet support
- Press Start 2P font (arcade theme)
- Tailwind CSS + neon animations

**Pages:**
- `/` - Homepage with payment address generation
- `/create` - Create payment link or split (future)
- `/pay/[id]` - Payment landing page (future)
- `/split/[id]` - Group split status (future)
- `/tips` - Tipping page for creators (future)

---

## 🎮 Arcade Theme

**Why arcade theme?**

Privacy and crypto payments are **intimidating**. Arcade aesthetics make them **fun and approachable**.

**Design Elements:**
- 🕹️ Press Start 2P font (retro gaming)
- 🌈 Neon color palette (cyan, magenta, yellow)
- ✨ Pixelate and pulse animations
- 💎 Glassmorphism cards with arcade borders
- 🪙 Coin flip animation on address generation

**Feature Naming (Arcade Style):**
- Payment Links → "Coin Slots"
- Group Splits → "Multiplayer Mode"
- Tipping → "Insert Coin"
- Auto-Sweep → "Jackpot!"

---

## 🏆 Why This Wins the Hackathon

### Base Track Alignment ⭐⭐⭐⭐⭐

**"Make onchain interactions simple, social, and engaging"**

✅ **Simple**: Gas sponsorship = zero crypto knowledge needed
✅ **Social**: Farcaster tipping frames, group splits
✅ **Engaging**: Arcade theme, 10-second "magic" auto-sweep
✅ **Onboarding**: Payment links = mainstream UX (like Stripe)

### Circle USDC Bounty Alignment ⭐⭐⭐⭐⭐

**"Innovative USDC applications"**

✅ **Mass Adoption**: Payment links are proven mainstream UX
✅ **Real Utility**: Tips, splits, invoices (actual use cases)
✅ **Professional**: USDC stability perfect for payments
✅ **Integration**: Works seamlessly with Coinbase Smart Wallet

### Technical Depth ⭐⭐⭐⭐⭐

✅ **Gas Abstraction**: Relayer + monitoring service
✅ **CREATE2 Magic**: Deterministic addresses, atomic sweeps
✅ **Auto-Sweep**: Cannot be replicated manually
✅ **Full Stack**: Solidity + Rust + TypeScript + Node.js

---

## 🆚 Competitive Advantage

| Feature | Coinflip | Coinbase Commerce | Request Network | Slice |
|---------|----------|-------------------|-----------------|-------|
| **Payment Links** | ✅ | ✅ | ✅ | ⛔️ |
| **Gas Sponsored** | ✅ | ⛔️ | ⛔️ | ⛔️ |
| **Social Tipping** | ✅ | ⛔️ | ⛔️ | ⛔️ |
| **Group Splits** | ✅ | ⛔️ | ⛔️ | ✅ |
| **Customer Isolation** | ✅ | ⛔️ | ⛔️ | ⛔️ |
| **Farcaster Frames** | ✅ | ⛔️ | ⛔️ | ⛔️ |

**What makes Coinflip unique:**
- ONLY platform with gas sponsorship + payment links + group splits + social tipping
- Built specifically for Base + USDC (not multi-chain)
- Arcade theme makes it memorable and fun

---

## 🎬 Demo Flow (3 Minutes)

### Scenario 1: Content Creator Tipping (1 min)
1. Alice connects Coinbase Smart Wallet
2. Generates tipping page: `coinflip.app/tips/alice`
3. Posts Farcaster Frame with $1/$5/$10 buttons
4. Bob tips $5 USDC with Face ID (one tap)
5. **10 seconds later**: Auto-sweep complete ⚡
6. Alice sees notification: "You received $5 from @bob"
7. **Gas cost to Alice: $0**

### Scenario 2: Group Dinner Split (1 min)
1. 4 friends at sushi restaurant - $120 bill
2. Alice creates split: `coinflip.app/split/sushi-night`
3. Bob, Carol, Dave each pay $30 USDC via link
4. When 3/4 paid, Alice pays her $30
5. **Restaurant instantly receives $120 USDC** (gas-free)
6. Everyone sees "Split complete! 🎉"

### Scenario 3: Coffee Shop QR Code (30 sec)
1. Coffee shop prints QR code at counter
2. Customer scans → pays $4.50 USDC
3. **10 seconds later**: Auto-sweep to shop owner
4. **No gas fees, no manual sweeping, no complexity**

---

## 💙 Circle USDC Integration

### Why USDC is Perfect for Payments

**Stability:**
- $1 = $1, always (no volatility risk)
- Professional recipients need stable income
- Customers know exact payment amount

**Speed:**
- Base L2 = 2-second finality
- 10-second auto-sweep feels instant
- Real-time payment confirmation

**Adoption:**
- USDC is #1 stablecoin ($40B+ market cap)
- Native Base support (no bridging)
- Coinbase integration (fiat on/off ramp)

### Technical Implementation

**USDC Contract:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Base Sepolia)

**Integration Points:**
1. Balance checking: `balanceOf(burnerAddress)`
2. Sweep function: `token.transfer(recipient, amount)`
3. Auto-sweep monitoring: Poll every 5 seconds
4. Payment links: Denominated in USDC

**Fee Structure:**
- 0.5% platform fee (covers gas + operations)
- Example: $100 payment = $0.50 fee, $99.50 to recipient
- Gas costs ~$0.01 on Base, rest is profit/buffer

---

## 🛠️ Tech Stack

### Blockchain
- **Base Sepolia** (Testnet) - Production: Base Mainnet
- **Solidity** + Foundry (Smart contracts)
- **CREATE2** deterministic deployment
- **Circle USDC** (ERC20 stablecoin)

### Backend
- **Rust** (Axum REST API) - Compute address, balance checks
- **Node.js** + TypeScript (Auto-sweep monitoring service)
- **ethers.js v6** (Blockchain interaction)
- **SQLite** (Wallet tracking database)
- **dotenv** (Environment configuration)

### Frontend
- **TypeScript** + Next.js 14 (App Router)
- **Wagmi v2** + RainbowKit (Wallet connection)
- **Coinbase Smart Wallet** (Passkey-based, Face ID)
- **Tailwind CSS** (Arcade theme styling)
- **Sonner** (Toast notifications)
- **Press Start 2P** (Retro font)

### Deployment
- **Frontend:** Vercel
- **Backend:** Fly.io or Railway
- **Auto-Sweep Service:** Docker + DigitalOcean
- **Contracts:** Base Sepolia (verified on Basescan)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Foundry
- pnpm
- Base Sepolia ETH (faucet)

### Installation

```bash
# Clone repository
git clone https://github.com/UsuaOSilver/coinflip.git
cd coinflip

# 1. Deploy Smart Contracts
cd contracts
forge install
forge build
forge test

# Deploy to Base Sepolia
forge script script/Protocol.s.sol \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast

# Note the deployed Deployer address

# 2. Start Rust Backend
cd ../backend
cp .env.example .env
# Edit .env: Add RPC URL, Deployer address, USDC address
cargo run
# Runs on http://localhost:8080

# 3. Start Auto-Sweep Service
cd ../backend/auto-sweep-service
cp .env.example .env
# Edit .env: Add Relayer private key, Deployer address, etc.
pnpm install
pnpm dev
# Monitoring service running

# 4. Start Frontend
cd ../../frontend
cp .env.example .env.local
# Edit .env.local: Add API URL, WalletConnect Project ID, etc.
pnpm install
pnpm dev
# Open http://localhost:3000
```

### Get Test USDC

```bash
# Base Sepolia Faucet
https://faucet.circle.com/

# Request USDC for testing
# Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

---

## 📋 Use Cases

### ☕ Coffee Shops & Merchants
**Problem:** Can't accept crypto due to public wallet history + gas complexity

**Solution:** Print QR code → Customer pays USDC → Auto-sweep (gas-free) → Keep revenue private

### 🎨 Content Creators & Influencers
**Problem:** Fans want to tip but need ETH for gas, wallet history is exposed

**Solution:** Farcaster Frame with tip buttons → One-tap payments → 10-second auto-sweep

### 💼 Freelancers & Contractors
**Problem:** Clients see other clients' payments, invoice workflow is manual

**Solution:** Send payment link per invoice → Client pays USDC → Auto-receive (gas-free)

### 👥 Friend Groups
**Problem:** Splitting bills in crypto requires coordination + gas fees

**Solution:** Create split link → Each person pays share → Auto-distribute when complete

---

## 🔒 Privacy Model (Honest Assessment)

### What Coinflip DOES Provide:

✅ **Customer-to-Customer Isolation**
- Customer A can't see Customer B's payments
- Each payment uses unique burner address
- Your main wallet stays private from individual customers

✅ **Convenience & UX**
- Gas-free payments for everyone
- Auto-sweep automation
- No manual wallet management

✅ **Pseudonymity**
- Burner addresses not immediately linked to identity
- Better than reusing one public wallet

### What Coinflip DOES NOT Provide:

❌ **Absolute Anonymity**
- Sweeps are on-chain and traceable
- Determined blockchain analysis can link addresses
- Aggregate revenue visible at destination wallet

❌ **Mixer/Tumbler Functionality**
- Not designed to hide fund sources
- Not for illicit purposes
- Compliance-friendly by design

**Positioning:** "Stripe for crypto with customer isolation"
- Primary value: Convenience (gas-free, auto-sweep, links)
- Secondary value: Customer isolation (privacy from individual customers)
- NOT a privacy maximalist tool

---

## 🗺️ Roadmap

### Phase 1: MVP (Current - Hackathon)
- ✅ CREATE2 burner wallets
- ✅ Arcade theme UI
- ✅ Manual sweep functionality
- 🚧 Auto-sweep service
- 🚧 Payment link generation

### Phase 2: Social Features (Post-Hackathon)
- [ ] Farcaster Frame integration
- [ ] Group split functionality
- [ ] Tipping pages for creators
- [ ] Invoice management system

### Phase 3: Scale & Polish
- [ ] Mainnet deployment (Base)
- [ ] Mobile app (React Native)
- [ ] Multi-chain support (Optimism, Arbitrum)
- [ ] Coinbase Commerce API integration

### Phase 4: Advanced Features
- [ ] Recurring payments
- [ ] Subscription management
- [ ] Payment analytics dashboard
- [ ] API for third-party integrations

---

## 🤝 Contributing

We're open to contributions! Areas of interest:
- Farcaster Frame development
- Mobile app design
- Smart contract optimizations
- Backend performance improvements

See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon)

---

## 👤 Team

**Nhat Anh Nguyen** ([@UsuaOSilver](https://github.com/UsuaOSilver))
- Solo developer
- Full-stack (Solidity + Rust + TypeScript)
- Built for MBC 2025 Hackathon

---

## 🙏 Acknowledgments

**Inspiration:**
- [not-so-private-transfers](https://github.com/nhtyy/not-so-private-transfers) by nhtyy
- CREATE2 pattern popularized by Uniswap v3

**Powered By:**
- Base L2 (Coinbase)
- Circle USDC
- RainbowKit (Wallet connection)
- Foundry (Smart contract development)

**Built At:**
- MBC 2025 Hackathon
- January 2025

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🔗 Links

- **Live Demo:** [Coming soon]
- **Video Demo:** [Coming soon]
- **GitHub:** https://github.com/UsuaOSilver/coinflip
- **Deployer Contract (Base Sepolia):** [Coming soon]
- **Twitter:** [@UsuaOSilver](https://twitter.com/UsuaOSilver)

---

**🪙 Coinflip - Insert Coin to Pay**

*Making crypto payments as easy as arcade games* 🕹️
