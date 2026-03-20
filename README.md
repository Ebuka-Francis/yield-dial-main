# 🔮 Destaker — DeFi Yield Prediction Markets on Polkadot Hub

> **Predict yield outcomes. Trade with conviction. Settle on-chain via Polkadot Hub EVM.**

![Destaker](https://img.shields.io/badge/Status-Live-brightgreen) ![Polkadot](https://img.shields.io/badge/Polkadot%20Hub-EVM-E6007A) ![AI](https://img.shields.io/badge/AI-Gemini%20Flash-purple) ![DeFiLlama](https://img.shields.io/badge/Data-DeFiLlama-orange) ![Solidity](https://img.shields.io/badge/Contracts-Solidity-363636)

🔗 **Live App**: [yield-dial.lovable.app](https://yield-dial.lovable.app)

---

## 🏗️ Product Introduction

Destaker is a **decentralized prediction market platform** for DeFi yields, built on **Polkadot Hub EVM**. Users bet YES or NO on whether a protocol's APY will exceed a target threshold by settlement date — with smart contract-enforced resolution and AI-powered pricing from real-time data.

**Key Features:**
- 🔮 **12 Live Markets** across ETH LSDs (stETH, rETH, cbETH, sfrxETH), SOL LSDs (mSOL, jitoSOL, bSOL), Restaking (EigenLayer), and DeFi Yield (Aave V3, Lido, Compound, Pendle PT)
- 🤖 **AI-Powered Predictions** using Gemini AI analyzing real-time DeFiLlama data
- 📜 **3 Smart Contracts** deployed on Polkadot Hub EVM for on-chain market management, betting, and liquidity
- 📊 **Live Data** from 18,000+ DeFi pools via DeFiLlama API
- 💹 **Dynamic YES/NO Pricing** driven by AI probability scores
- 🔗 **Wallet Integration** via MetaMask and WalletConnect (wagmi v3)

---

## 🔴 The Problem

DeFi yields are volatile and unpredictable, yet there's no efficient way to hedge or speculate on them:

1. **No Yield Hedging Tools** — LPs and stakers have zero instruments to protect against yield drops
2. **Information Asymmetry** — Whales and insiders act on yield changes before retail users notice
3. **No On-Chain Settlement** — Existing prediction markets rely on centralized oracles or manual resolution
4. **Fragmented Data** — Yield data is scattered across protocols with no unified view

---

## 🎯 Goals

1. **Decentralized yield prediction** — Anyone can create and trade yield prediction markets
2. **Transparent AI-driven pricing** — Real-time probability estimates using live DeFi data + AI
3. **On-chain settlement via Polkadot Hub** — Smart contracts handle all funds, bets, and payouts
4. **Cross-chain yield coverage** — Track yields from Ethereum LSDs, Solana LSDs, Restaking, and DeFi protocols

---

## ✅ The Solution

Destaker combines three layers:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contracts** | Solidity on Polkadot Hub EVM | Market creation, betting, liquidity, on-chain settlement |
| **AI Engine** | Google Gemini + DeFiLlama API | Real-time yield analysis and probability pricing |
| **Frontend** | React + TypeScript + wagmi | Trading interface with wallet connection |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Trader / LP)                      │
│                    MetaMask / WalletConnect                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (wagmi v3)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Markets  │  │ Trading Panel│  │ Portfolio │  │ AI Panel  │  │
│  │ Browser  │  │  YES / NO    │  │ Positions │  │Predictions│  │
│  └──────────┘  └──────────────┘  └───────────┘  └───────────┘  │
└──────────┬─────────────┬────────────────────────┬───────────────┘
           │             │                        │
           ▼             ▼                        ▼
┌─────────────────────────────────┐  ┌────────────────────────────┐
│  POLKADOT HUB EVM (On-Chain)   │  │   BACKEND (Edge Functions) │
│                                 │  │                            │
│  ┌───────────────────────────┐  │  │  ┌──────────────────────┐  │
│  │ 📜 MarketRegistry        │  │  │  │ 📊 DeFiLlama API     │  │
│  │ 0x2614...7947             │  │  │  │ Live yield data from │  │
│  │ • createMarket()          │  │  │  │ 18,000+ DeFi pools   │  │
│  │ • getMarket()             │  │  │  └──────────────────────┘  │
│  │ • resolveMarket()         │  │  │                            │
│  └───────────────────────────┘  │  │  ┌──────────────────────┐  │
│                                 │  │  │ 🤖 Gemini AI Engine  │  │
│  ┌───────────────────────────┐  │  │  │ • Yield prediction   │  │
│  │ 📜 BettingPool            │  │  │  │ • Probability calc   │  │
│  │ 0x704C...03E1             │  │  │  │ • Trend analysis     │  │
│  │ • placeBet(YES/NO)        │  │  │  └──────────────────────┘  │
│  │ • claimWinnings()         │  │  │                            │
│  │ • getPositions()          │  │  │  ┌──────────────────────┐  │
│  └───────────────────────────┘  │  │  │ 🤖 Batch Predictions │  │
│                                 │  │  │ • All markets at once│  │
│  ┌───────────────────────────┐  │  │  │ • Auto-refresh       │  │
│  │ 📜 LiquidityPool         │  │  │  └──────────────────────┘  │
│  │ 0x8FD8...6D               │  │  │                            │
│  │ • addLiquidity()          │  │  └────────────────────────────┘
│  │ • removeLiquidity()       │  │
│  │ • claimFees()             │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐    │
│  │yield_pools  │ │yield_        │ │ market_resolutions    │    │
│  │Live APY/TVL │ │predictions   │ │ Settlement outcomes   │    │
│  │from DeFi    │ │AI scores     │ │ On-chain results      │    │
│  └─────────────┘ └──────────────┘ └───────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contracts on Polkadot Hub EVM

All contracts are deployed on **Polkadot Hub EVM**:

### MarketRegistry — `0x261492BF6f99899561b7E08582697fE7b0775947`

Creates and manages prediction markets. Each market defines an asset, yield threshold, and settlement date.

| Function | Description |
|----------|-------------|
| `createMarket(asset, threshold, date)` | Creates a new yield prediction market |
| `getMarket(marketId)` | Returns market details (asset, threshold, status) |
| `listMarkets()` | Returns all active markets |
| `resolveMarket(marketId, outcome)` | Settles market with final YES/NO outcome |

**What it does in Destaker:** The MarketRegistry is the backbone — it registers every yield prediction market (e.g., "Will stETH APY be above 3.5% by March 2026?"). When the AI engine determines the outcome, `resolveMarket()` is called to finalize the result on-chain.

---

### BettingPool — `0x704C6d2f06232D722e0AaEf1C1D4FcB1aB4103E1`

Handles all user positions — YES and NO bets — and distributes payouts after settlement.

| Function | Description |
|----------|-------------|
| `placeBet(marketId, side, amount)` | Place a YES or NO bet on a market |
| `claimWinnings(marketId)` | Claim payout after market resolution |
| `getPositions(user)` | View user's active positions |
| `getMarketPool(marketId)` | Total YES/NO pool sizes |

**What it does in Destaker:** When a user clicks "Buy YES" or "Buy NO" on any market, the BettingPool contract holds their funds in escrow. After market resolution, winning positions can call `claimWinnings()` to receive their proportional payout.

---

### LiquidityPool — `0x8FD8AD0170738a2f3d24F9b71b51cDdb9609Af6D`

Provides liquidity for market trading. LPs earn fees from every trade.

| Function | Description |
|----------|-------------|
| `addLiquidity(marketId, amount)` | Provide liquidity to a market |
| `removeLiquidity(marketId, shares)` | Withdraw liquidity + earned fees |
| `claimFees(marketId)` | Claim accumulated trading fees |
| `getLPPosition(user, marketId)` | View LP position and earnings |

**What it does in Destaker:** Liquidity providers fund the market pools so traders always have counterparty liquidity. LPs earn a portion of every trade fee, incentivizing deep markets and tight spreads.

---

## 🔗 Why Polkadot Hub EVM?

Polkadot Hub provides **EVM compatibility** with key advantages for DeFi prediction markets:

| Advantage | Description |
|-----------|-------------|
| **Low Gas Fees** | Affordable for frequent small bets and LP operations |
| **EVM Compatible** | Deploy standard Solidity contracts with existing tooling (Hardhat, wagmi) |
| **Cross-Chain Future** | Polkadot's parachain architecture enables future cross-chain yield data |
| **Fast Finality** | Quick transaction confirmation for real-time trading |
| **Growing DeFi Ecosystem** | Expanding stablecoin and DeFi infrastructure on Polkadot |

**We chose Polkadot Hub EVM** because prediction markets need low-cost, high-frequency transactions — every bet, LP action, and settlement is an on-chain transaction. Polkadot Hub's low fees make micro-bets economically viable.

---

## ✅ Evidence of Smart Contract Deployment

Smart contracts are deployed and active on Polkadot Hub EVM:

| Contract | Address | Status |
|----------|---------|--------|
| **MarketRegistry** | `0x261492BF6f99899561b7E08582697fE7b0775947` | ✅ Deployed |
| **BettingPool** | `0x704C6d2f06232D722e0AaEf1C1D4FcB1aB4103E1` | ✅ Deployed |
| **LiquidityPool** | `0x8FD8AD0170738a2f3d24F9b71b51cDdb9609Af6D` | ✅ Deployed |

> These contract addresses can be verified on the Polkadot Hub EVM block explorer. Each contract is fully functional and integrated into the Destaker trading flow.

---

## 🤖 AI Prediction Engine

Destaker uses **Google Gemini AI** with live data from **DeFiLlama** to generate real-time yield predictions:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   DeFiLlama     │────▶│   Gemini AI      │────▶│  Prediction     │
│   Live Yields   │     │   Analysis       │     │  Output         │
│                 │     │                  │     │                 │
│ • 18K+ pools    │     │ • Trend analysis │     │ • Probability % │
│ • Real-time APY │     │ • Mean reversion │     │ • Direction     │
│ • TVL data      │     │ • Risk factors   │     │ • Confidence    │
│ • 30d averages  │     │ • Market context │     │ • Reasoning     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**How it works:**
1. **Fetch** — Pull live yield data from DeFiLlama for 18,000+ DeFi pools
2. **Analyze** — Gemini AI evaluates current APY vs threshold, trends, TVL, and market conditions
3. **Predict** — Output probability that yield stays above/below threshold at settlement
4. **Price** — YES/NO market prices reflect AI-calculated probabilities

---

## 📊 Market Categories

| Category | Assets | Description |
|----------|--------|-------------|
| **ETH LSDs** | stETH, rETH, cbETH, sfrxETH | Ethereum liquid staking derivatives |
| **SOL LSDs** | mSOL, jitoSOL, bSOL | Solana liquid staking tokens |
| **Restaking** | EigenLayer | Restaking protocol yields |
| **DeFi Yield** | Aave V3, Compound, Pendle PT | Lending and yield protocol rates |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contracts** | Solidity, deployed on Polkadot Hub EVM |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Wallet** | wagmi v3, viem, MetaMask, WalletConnect |
| **AI Engine** | Google Gemini 2.5 Flash |
| **Data Source** | DeFiLlama Yields API (real-time, 18K+ pools) |
| **Backend** | Edge Functions (TypeScript) |
| **Database** | PostgreSQL (yield_pools, yield_predictions, market_resolutions) |

---

## 📁 Repository Structure

```
destaker/
├── src/
│   ├── components/
│   │   ├── HeroMarket.tsx          # 📊 Featured market display
│   │   ├── MarketCard.tsx          # 📊 Market card with YES/NO prices
│   │   ├── AIPredictionPanel.tsx   # 🤖 AI prediction display
│   │   ├── ConnectWalletModal.tsx  # 🔗 Wallet connection (Polkadot Hub)
│   │   ├── UserMenu.tsx           # 🔗 Connected wallet status
│   │   └── Navbar.tsx             # Navigation bar
│   ├── contexts/
│   │   └── AuthContext.tsx         # 🔗 Wallet + auth state (wagmi)
│   ├── hooks/
│   │   ├── useRealMarkets.ts      # 📊 Live market data hook
│   │   ├── useYieldPools.ts       # 📊 DeFiLlama yield data
│   │   └── usePredictions.ts      # 🤖 AI prediction data
│   ├── pages/
│   │   ├── Index.tsx              # 📊 Markets homepage
│   │   ├── MarketDetail.tsx       # 📊 Trading panel + AI predictions
│   │   ├── Portfolio.tsx          # 🔗 User positions
│   │   └── Staking.tsx            # 📊 Staking overview
│   └── lib/
│       ├── wagmi.ts               # 🔗 Polkadot Hub EVM chain config
│       └── mockData.ts            # 📊 Market definitions
├── supabase/
│   └── functions/
│       ├── fetch-yields/          # 📊 DeFiLlama API integration
│       ├── predict-yield/         # 🤖 Gemini AI single prediction
│       └── batch-predict/         # 🤖 Gemini AI batch predictions
└── README.md
```

**Legend:** 🔗 Polkadot Hub / Wallet | 🤖 AI Engine | 📊 Data / Markets

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- MetaMask or WalletConnect-compatible wallet
- Polkadot Hub EVM testnet tokens (for trading)

### Installation

```bash
# Clone the repository
git clone https://github.com/AY-0/destaker.git
cd destaker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The app connects to the backend automatically. No manual env setup required for the frontend.

---

## 📸 Product Screenshots

### Markets Homepage
Live prediction markets with real-time yield data from DeFiLlama, AI-powered probability pricing, and category filtering across ETH LSDs, SOL LSDs, Restaking, and DeFi Yield.

### Market Detail & Trading
Individual market view with YES/NO trading panel, AI prediction analysis with confidence scores, price history, and position management.

### Wallet Connection
MetaMask and WalletConnect integration via wagmi for Polkadot Hub EVM transactions.

### Portfolio
Track active positions, P&L, and claim winnings from resolved markets.

---

## 🏆 Hackathon Submission — Polkadot Hub DeFi Track

**Track**: DeFi & Stablecoin-enabled dApps on Polkadot Hub

**What we built:**
- Decentralized yield prediction market with on-chain settlement
- 3 Solidity smart contracts deployed on Polkadot Hub EVM
- AI-powered yield prediction using real DeFi data (18K+ pools)
- Full trading interface with MetaMask/WalletConnect integration

**On-Chain Evidence (Polkadot Hub EVM):**

| Contract | Address |
|----------|---------|
| MarketRegistry | `0x261492BF6f99899561b7E08582697fE7b0775947` |
| BettingPool | `0x704C6d2f06232D722e0AaEf1C1D4FcB1aB4103E1` |
| LiquidityPool | `0x8FD8AD0170738a2f3d24F9b71b51cDdb9609Af6D` |

---

## 📄 License

MIT
