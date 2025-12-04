# PrivatePay

**Privacy for recipients—accept USDC payments without revealing your wallet**

---

## 🎯 The Problem

Every crypto payment exposes your entire financial history.

**Watch what happens when you accept a payment:**
1. Customer sends you $5 in crypto
2. Customer opens block explorer
3. Customer sees:
   - ✗ Your total balance
   - ✗ Every payment you've ever received
   - ✗ Every transaction you'll make in the future

**For professional recipients—merchants, creators, freelancers—this is unacceptable.**

Your customers don't need to see your total revenue.
Your fans don't need to track all your earnings.
Your clients don't need to see your other clients' payments.

---

## 💡 The Solution

**PrivatePay** uses CREATE2 burner wallets to protect recipients, not senders.

### How It Works

```
Customer → Burner Address (ephemeral) → Your Real Wallet (private)
```

1. **Generate**: Create a temporary payment address (not deployed yet)
2. **Receive**: Customer sends USDC to the burner address
3. **Sweep**: Deploy wallet + sweep funds to your real wallet in one transaction
4. **Privacy**: Customer never sees your actual wallet address

### Why This Is Different

| Tool | Privacy For | What It Solves |
|------|-------------|----------------|
| Umbra | **Senders** | "I want to send money privately" |
| Fluidkey | **Senders** | "I want cross-chain privacy" |
| Railgun | **Senders** | "I want strong anonymity" |
| **PrivatePay** | **Recipients** | "I want to receive payments privately" |

**We're the first privacy tool designed for recipients.**

---

## 🏗️ Tech Stack

### Smart Contracts
- **Solidity** + Foundry
- **CREATE2** deterministic deployment
- **EIP-712** typed signatures
- Deployed to **Base Sepolia**

### Backend
- **Rust** + Axum REST API
- Alloy for Ethereum interactions
- ERC20 (USDC) integration

### Frontend
- **TypeScript** + Next.js 14
- **Tailwind CSS**
- **Wagmi** + RainbowKit (wallet connection)
- React Query (state management)

### Deployment
- Frontend: **Vercel**
- Backend: **Railway**
- Contracts: **Base Sepolia** testnet

---

## 🎬 Demo

### Live App
🔗 [Coming soon]

### Video Demo
🎥 [Coming soon]

### Contracts
📜 Base Sepolia:

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/UsuaOSilver/privatepay.git
cd privatepay

# Install dependencies
cd frontend && pnpm install
cd ../backend && cargo build
cd ../contracts && forge install

# Deploy contracts to Base Sepolia
cd contracts
forge script script/Protocol.s.sol \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast

# Start backend
cd ../backend
cp .env.example .env
# Edit .env with your RPC URL and deployed contract address
cargo run

# Start frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your API URL
pnpm dev

# Open http://localhost:3000
```

Full setup instructions: See [TESTING.md](./TESTING.md)

---

## 🎯 Use Cases

### 1. Coffee Shop Owner at ETH Events
"I accept crypto at ETHDenver. My customers don't need to see how much I make."

### 2. Content Creator Accepting Tips
"I'm a crypto Twitter influencer. My fans don't need to track all my earnings."

### 3. Freelance Smart Contract Auditor
"I get paid by multiple clients. They don't need to see each other's payments."

**What unifies them**: Individuals with repeated customer/client interactions who want earnings privacy.

---

## 💰 Circle USDC Integration

### Why USDC?

Professional recipients need **stable** payments, not volatile crypto.

**Benefits**:
- ✅ **Price stability**: $1 = $1, always
- ✅ **Fast settlement**: Base L2 = 2-second finality
- ✅ **Low fees**: < $0.01 per transaction
- ✅ **Wide adoption**: USDC is the #1 stablecoin

### Technical Integration

- **USDC Contract**: Base Sepolia `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **ERC20 balance checking** via backend API (`/api/balance-usdc/:address`)
- **ERC20 sweep function** in Wallet.sol
- **Payment requests** denominated in USDC with QR codes

### Why Circle for Recipients?

Merchants, creators, and freelancers need **stable earnings**. USDC eliminates volatility risk while preserving privacy.

---

## 🌐 Built on Base

### Why Base?

1. **Low fees**: < $0.01 per transaction = viable for small payments
2. **Fast finality**: 2-second blocks = great UX
3. **EVM compatibility**: Reuse existing Solidity tooling

### Base-Specific Features

- Deployed to Base Sepolia testnet
- Optimized for Base's gas model
- Integrated with Basescan explorer

---

## 🏛️ Architecture

### High-Level Flow

```
┌─────────────┐
│  Customer   │ Sends USDC to burner address
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Burner    │ (CREATE2 address, not deployed)
│   Address   │
└──────┬──────┘
       │
       │ Merchant deploys + sweeps (1 transaction)
       ▼
┌─────────────┐
│  Merchant   │ Receives USDC privately
│ Real Wallet │ (Customer never sees this)
└─────────────┘
```

### Key Technology

**CREATE2 Deterministic Addresses**:
```
address = keccak256(0xff ++ deployer ++ salt ++ initCodeHash)[12:]
```

- Address computed **before** deployment
- Funds sent to undeployed address
- Deploy + sweep in **atomic transaction**

**EIP-712 Typed Signatures**:
- Secure relay authentication
- Human-readable wallet prompts
- Replay protection

---

## 🔒 Privacy vs Anonymity

### What PrivatePay Provides: **Privacy**

✅ Customer can't link payments to merchant's main wallet

✅ All transactions are on-chain and auditable

✅ Compliance-friendly (not a mixer)

Think **Signal**, not Tor.

### What PrivatePay Does NOT Provide: **Anonymity**

⛔️ Not a mixer (like Tornado Cash)

⛔️ Not hiding from governments/law enforcement

⛔️ Not for illicit use

**Our focus**: Legitimate businesses who want earnings privacy.

---

## 🆚 Competitor Comparison

| Feature | PrivatePay | Umbra | Fluidkey | Railgun |
|---------|-----------|-------|----------|---------|
| **Privacy For** | Recipients | Senders | Senders | Both |
| **USDC Native** | ✅ | ⛔️ | ⛔️ | ✅ |
| **Merchant Focus** | ✅ | ⛔️ | ⛔️ | ⛔️ |
| **UX Simplicity** | ✅ High | Medium | Medium | Low |
| **Regulatory** | Compliant | Compliant | Compliant | Complex |

---

## 🧪 Testing

See [TESTING.md](./TESTING.md) for:
- Local testing with Anvil
- Base Sepolia testnet deployment
- End-to-end flow testing
- Contract verification

---

## 📜 License

MIT License - see [LICENSE](./LICENSE)