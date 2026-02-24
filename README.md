# Destaker — AI-Powered Yield Prediction Markets

> **Sybil-resistant prediction markets for DeFi yields, powered by World ID verification and real-time AI predictions.**

![Destaker](https://img.shields.io/badge/Status-Live-brightgreen) ![World ID](https://img.shields.io/badge/World%20ID-Integrated-blue) ![AI](https://img.shields.io/badge/AI-Gemini%20Flash-purple) ![DeFiLlama](https://img.shields.io/badge/Data-DeFiLlama-orange) ![CRE](https://img.shields.io/badge/CRE-Chainlink-375BD2)

🔗 **Live App**: [yield-dial.lovable.app](https://yield-dial.lovable.app)

---

## 🏗️ Product Introduction

Destaker is a **decentralized prediction market platform** focused on DeFi yield outcomes. Users can trade YES/NO positions on whether specific yield assets (ETH LSDs, SOL LSDs, restaking protocols, DeFi yield pools) will exceed target APY thresholds by settlement dates.

**Key Features:**
- 🔮 **12 Live Markets** across ETH LSDs (stETH, rETH, cbETH, sfrxETH), SOL LSDs (mSOL, jitoSOL, bSOL), Restaking (EigenLayer), and DeFi Yield (Aave V3, Lido, Compound, Pendle PT)
- 🤖 **AI-Powered Predictions** using Gemini AI analyzing real-time DeFiLlama data
- 🌐 **World ID Verification** for Sybil-resistant trading (Cloud + On-Chain ready)
- ⚡ **CRE Workflow** — Chainlink Runtime Environment orchestration for market settlement
- 📊 **Live Data** from 18,000+ DeFi pools via DeFiLlama API
- 💹 **Dynamic YES/NO Pricing** driven by AI probability scores

---

## 🔴 The Problem

DeFi yield markets suffer from three critical issues:

1. **Sybil Attacks** — Prediction markets are vulnerable to users creating multiple accounts to manipulate outcomes
2. **Information Asymmetry** — Retail traders lack access to sophisticated yield forecasting tools
3. **Static Pricing** — Traditional prediction markets use AMM-based pricing that doesn't incorporate real-time yield data

---

## ✅ The Solution

Destaker solves these problems through:

| Problem | Solution | Technology |
|---------|----------|-----------|
| Sybil Attacks | World ID human verification | `@worldcoin/idkit` v4 + Cloud verification API |
| Information Asymmetry | AI yield predictions with full transparency | Gemini 2.5 Flash Lite + DeFiLlama real-time data |
| Static Pricing | Dynamic pricing from AI probability scores | Live pool analysis → YES/NO price computation |

---

## ⚙️ How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Market   │ │ Trading  │ │ AI Panel │ │ World ID Widget  │   │
│  │ Cards    │ │ Panel    │ │          │ │ (IDKit v4)       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
└───────┼─────────────┼───────────┼─────────────────┼─────────────┘
        │             │           │                 │
        ▼             ▼           ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Edge Functions)                      │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐    │
│  │ fetch-yields│ │ predict-yield│ │ verify-worldid        │    │
│  │ 📊 Data    │ │ 🤖 AI       │ │ 🌐 World ID           │    │
│  └──────┬──────┘ └──────┬───────┘ └───────────┬───────────┘    │
│         │               │                     │                 │
│  ┌──────┴──────┐ ┌──────┴───────┐ ┌───────────┴───────────┐    │
│  │ batch-      │ │ cre-workflow │ │ worldid-rp-context    │    │
│  │ predict     │ │ -simulate    │ │ 🌐 World ID           │    │
│  │ 🤖 AI      │ │ ⚡ CRE       │ │                       │    │
│  └─────────────┘ └──────────────┘ └───────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
        │               │                     │
        ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐    │
│  │ DeFiLlama  │ │ Gemini AI    │ │ World ID Cloud API    │    │
│  │ Yields API │ │ (2.5 Flash)  │ │ developer.worldcoin   │    │
│  │ 18K+ pools │ │              │ │ .org                  │    │
│  └─────────────┘ └──────────────┘ └───────────────────────┘    │
│  ┌─────────────┐                                                │
│  │ Ethereum    │                                                │
│  │ RPC (Block  │                                                │
│  │ Data)       │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐    │
│  │yield_pools  │ │yield_        │ │ market_resolutions    │    │
│  │1,859 pools  │ │predictions   │ │ Settlement outcomes   │    │
│  │APY, TVL     │ │AI scores     │ │ CRE workflow results  │    │
│  └─────────────┘ └──────────────┘ └───────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌──────────────────────────────────────────────────────┐
│                      PAGES                            │
│  Index (Markets) ──► MarketDetail (Trading)           │
│  Portfolio                                             │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│                    COMPONENTS                         │
│  Navbar + UserMenu ──► ConnectWalletModal             │
│  MarketCard ──► HeroMarket                            │
│  AIPredictionPanel ──► WorldIDVerify                  │
│  StatCard ──► NavLink                                 │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│                      HOOKS                            │
│  useRealMarkets ──► useYieldPools + usePredictions    │
└──────────┬───────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│                     CONTEXT                           │
│  AuthContext — Wallet + World ID Verification State   │
└──────────────────────────────────────────────────────┘
```

---

## 🌐 World ID Integration

### Overview

World ID provides **Sybil-resistant identity verification** ensuring each trader is a unique human. Destaker implements both **Cloud (Off-Chain)** and is **On-Chain ready**.

### Verification Flow

```
User ──► Frontend (IDKit v4) ──► RP Context Function
                                       │
                                       ▼
                                 World App (QR)
                                       │
                                       ▼
                                 Proof Generated
                                       │
                                       ▼
                              Verify Function ──► World ID Cloud API
                                       │              POST /api/v2/verify
                                       ▼
                              ✅ Verified Human Badge
```

### 🌐 World ID Code Files

| File | Purpose | Function |
|------|---------|----------|
| `src/components/WorldIDVerify.tsx` | 🌐 **World ID** — IDKit v4 React widget | Renders verification button, handles proof callback |
| `supabase/functions/verify-worldid/index.ts` | 🌐 **World ID** — Cloud proof verification | Receives proof → calls World ID API → returns status |
| `supabase/functions/worldid-rp-context/index.ts` | 🌐 **World ID** — RP context generation | Generates HMAC-SHA256 signed nonce for IDKit v4 |
| `src/contexts/AuthContext.tsx` | 🌐 **World ID** — Auth state management | Stores wallet + verification state |
| `src/components/ConnectWalletModal.tsx` | 🌐 **World ID** — Verification modal | Two-step: Connect Wallet → Verify with World ID |

### Verification Levels
- **Device** — Lower friction, device-based verification
- **Orb** — Higher trust, biometric Orb verification
- Both levels unlock trading access

### Key Configuration
- **App ID**: `app_135f61bfd908558b3c07fd6580d58192`
- **Action**: `destaker-verify`
- **Cloud API**: `https://developer.worldcoin.org/api/v2/verify/`
- **IDKit Version**: `@worldcoin/idkit` v4.0.1

---

## 🤖 AI Prediction Engine

### How AI Predictions Work

1. **Data Collection**: Fetches live yield data from DeFiLlama (18,000+ pools)
2. **Analysis**: Filters to relevant pools, extracts APY, 30-day mean APY, TVL
3. **AI Reasoning**: Gemini 2.5 Flash Lite analyzes yield trends, market conditions
4. **Output**: Structured prediction with confidence score, probability, reasoning, risk factors

### 🤖 AI Code Files

| File | Purpose | Technology |
|------|---------|-----------|
| `supabase/functions/predict-yield/index.ts` | 🤖 **AI** — Single market prediction engine | Gemini AI + DeFiLlama API |
| `supabase/functions/batch-predict/index.ts` | 🤖 **AI** — Batch prediction for all markets | Parallel Gemini AI calls |
| `src/components/AIPredictionPanel.tsx` | 🤖 **AI** — Prediction display component | Shows confidence, reasoning, risk factors |
| `src/hooks/usePredictions.ts` | 🤖 **AI** — Prediction data hooks | Fetches/triggers predictions |

---

## ⚡ CRE Workflow — Live Implementation

### Overview

Destaker includes a **fully functional CRE Workflow** (Chainlink Runtime Environment) that serves as an orchestration layer for yield prediction market settlement. The workflow integrates:

1. **Blockchain** — Ethereum Mainnet (reads block number, chain ID via JSON-RPC)
2. **External API** — DeFiLlama (fetches 18,000+ DeFi yield pools)
3. **AI Agent** — Gemini 2.5 Flash Lite (determines settlement outcomes)
4. **Data Write** — Stores settlement reports (simulating on-chain `SimpleMarket.settleMarket()`)

### CRE Workflow Architecture

```
Step 1          Step 2              Step 3              Step 4           Step 5
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐   ┌────────────┐
│ ⏰ Cron  │──►│ 🔗 Blockchain│──►│ 🌐 DeFiLlama│──►│ 🤖 Gemini  │──►│ 💾 Database│
│ Trigger  │   │ Read (ETH)   │   │ API (18K+   │   │ AI Agent   │   │ Write      │
│ Every    │   │ Block Number │   │ pools)      │   │ Settlement │   │ Results    │
│ 30min    │   │ Chain ID     │   │ Live APY    │   │ Outcome    │   │ Stored     │
└──────────┘   └──────────────┘   └──────────────┘   └────────────┘   └────────────┘
    0ms            ~400ms              ~700ms             ~100ms          ~800ms
```

### ⚡ CRE Workflow Code Files

| File | Label | Purpose |
|------|-------|---------|
| `cre-workflow/project.yaml` | ⚡ **CRE** | CRE project configuration (RPCs, targets) |
| `cre-workflow/destaker-settlement/workflow.yaml` | ⚡ **CRE** | Workflow-specific config |
| `cre-workflow/destaker-settlement/main.ts` | ⚡ **CRE** | Main workflow entry point (CRE SDK pattern) |
| `cre-workflow/destaker-settlement/defillama.ts` | ⚡ **CRE** | DeFiLlama API integration module |
| `cre-workflow/destaker-settlement/gemini.ts` | ⚡ **CRE** | Gemini AI settlement logic |
| `cre-workflow/destaker-settlement/types.ts` | ⚡ **CRE** | Shared type definitions |
| `cre-workflow/destaker-settlement/config.staging.json` | ⚡ **CRE** | Staging config (12 markets) |
| `supabase/functions/cre-workflow-simulate/index.ts` | ⚡ **CRE** | Live simulation edge function (backend only) |

### How to Run

**Option 1: CRE CLI (Local Simulation)**
```bash
npm install -g @chainlink/cre-cli
cre workflow simulate destaker-settlement --target staging-settings
```

**Option 2: Live Edge Function (Backend — Deployed)**
```bash
curl -X POST https://pgereiuwcgumeacibpee.supabase.co/functions/v1/cre-workflow-simulate
```

> **Note**: The CRE Workflow runs entirely on the backend. There is no frontend UI for it — all orchestration happens server-side via edge functions.

### ✅ Live CRE Execution Evidence

**Workflow completed successfully with 5 steps:**

```json
{
  "execution": {
    "timestamp": "2026-02-22T14:12:03.672Z",
    "total_duration_ms": 1457,
    "status": "success",
    "steps_completed": 5
  },
  "blockchain": {
    "chain": "ethereum-mainnet",
    "chain_id": "1",
    "block_number": 24512926,
    "rpc": "https://ethereum-rpc.publicnode.com"
  },
  "external_api": {
    "source": "DeFiLlama",
    "total_pools": 18063,
    "url": "https://yields.llama.fi/pools"
  },
  "ai_agent": {
    "model": "google/gemini-2.5-flash-lite",
    "markets_settled": 3
  }
}
```

**Step-by-step execution:**

| Step | Name | Type | Duration | Status | Key Data |
|------|------|------|----------|--------|----------|
| 1 | Cron Trigger | trigger | 0ms | ✅ | Schedule: `0 */30 * * * *` |
| 2 | Blockchain Read | blockchain_read | 366ms | ✅ | ETH Block #24,512,929, Chain ID: 1 |
| 3 | External API (DeFiLlama) | external_api | 738ms | ✅ | 18,063 pools, 3 markets matched |
| 4 | AI Agent (Gemini) | ai_agent | 92ms | ✅ | 3 markets settled with AI |
| 5 | Data Write | data_write | 797ms | ✅ | 3 records stored |

**Real yield data fetched from DeFiLlama:**

| Asset | Current APY | 30d Mean | TVL | Project | Chain |
|-------|-------------|----------|-----|---------|-------|
| stETH | 2.3020% | 2.4636% | $18.68B | Lido | Ethereum |
| mSOL | 6.7108% | 6.1387% | $0.25B | Marinade | Solana |
| Aave V3 | 0.0001% | 0.0001% | $4.58B | Aave V3 | Ethereum |

**AI Settlement Results:**

| Asset | APY | Threshold | Outcome | Confidence |
|-------|-----|-----------|---------|------------|
| stETH | 2.302% | 3.5% | **NO** | 90% |
| mSOL | 6.7108% | 7.0% | **NO** | 90% |
| Aave V3 | 0.0001% | 5.0% | **NO** | 90% |

**Database records created:**
```sql
SELECT market_id, asset, final_apy, resolution_source, resolution_data->>'outcome' 
FROM market_resolutions;
-- 001 | stETH   | 2.302  | CRE Workflow (Gemini AI + DeFiLlama) | NO
-- 004 | mSOL    | 6.7108 | CRE Workflow (Gemini AI + DeFiLlama) | NO
-- 009 | Aave V3 | 0.0001 | CRE Workflow (Gemini AI + DeFiLlama) | NO
```

---

## 📊 Data Sources & APIs

### Real-Time APIs Used

| API | Purpose | Endpoint |
|-----|---------|----------|
| **DeFiLlama Yields** | Live APY data for 18,000+ pools | `https://yields.llama.fi/pools` |
| **World ID Cloud** | Human verification | `https://developer.worldcoin.org/api/v2/verify/` |
| **Gemini AI** | Yield predictions | Lovable AI Gateway |
| **Ethereum RPC** | Blockchain data for CRE | `https://ethereum-rpc.publicnode.com` |

### 📊 Data Code Files

| File | Purpose |
|------|---------|
| `supabase/functions/fetch-yields/index.ts` | 📊 **Data** — DeFiLlama pool fetcher, filters & stores 1,859 pools |
| `src/hooks/useYieldPools.ts` | 📊 **Data** — React hook for yield pool data |
| `src/hooks/useRealMarkets.ts` | 📊 **Data** — Combines pools + predictions into market prices |

---

## 📁 Repository Structure

### File Index with Labels

```
src/
├── components/
│   ├── WorldIDVerify.tsx        # 🌐 World ID — IDKit v4 widget
│   ├── ConnectWalletModal.tsx   # 🌐 World ID — Wallet + verify flow
│   ├── UserMenu.tsx             # 🌐 World ID — Navbar auth status
│   ├── AIPredictionPanel.tsx    # 🤖 AI — Prediction display
│   ├── MarketCard.tsx           # 📊 Data — Market card with live prices
│   ├── HeroMarket.tsx           # 📊 Data — Featured market banner
│   ├── StatCard.tsx             # UI — Stat display component
│   ├── NavLink.tsx              # UI — Navigation link
│   └── Navbar.tsx               # UI — Top navigation bar
├── contexts/
│   └── AuthContext.tsx           # 🌐 World ID — Global auth state
├── hooks/
│   ├── useRealMarkets.ts        # 📊 Data — Live market computation
│   ├── useYieldPools.ts         # 📊 Data — DeFiLlama pool data
│   └── usePredictions.ts        # 🤖 AI — Prediction hooks
├── pages/
│   ├── Index.tsx                 # Markets homepage
│   ├── MarketDetail.tsx          # Trading + AI prediction page
│   ├── Portfolio.tsx             # User portfolio
│   └── NotFound.tsx              # 404 page
└── lib/
    └── mockData.ts               # Market type definitions

supabase/functions/
├── verify-worldid/index.ts       # 🌐 World ID — Cloud verification
├── worldid-rp-context/index.ts   # 🌐 World ID — RP context generator
├── predict-yield/index.ts        # 🤖 AI — Single market AI prediction
├── batch-predict/index.ts        # 🤖 AI — Batch AI predictions
├── fetch-yields/index.ts         # 📊 Data — DeFiLlama data fetcher
└── cre-workflow-simulate/index.ts # ⚡ CRE — Live workflow simulation

cre-workflow/
├── project.yaml                   # ⚡ CRE — Project configuration
└── destaker-settlement/
    ├── workflow.yaml              # ⚡ CRE — Workflow config
    ├── main.ts                    # ⚡ CRE — Main entry point
    ├── defillama.ts               # ⚡ CRE — DeFiLlama integration
    ├── gemini.ts                  # ⚡ CRE — Gemini AI settlement
    ├── types.ts                   # ⚡ CRE — Shared types
    └── config.staging.json        # ⚡ CRE — Staging configuration
```

---

## ✅ Evidence of Working System

### Backend Verification

**1. DeFiLlama Data Fetch** — Successfully fetches and stores 1,859 pools from 18,063 total:
```
Fetching pools from DeFiLlama...
Received 18063 total pools from DeFiLlama
Filtered to 1859 relevant pools
Upserted 1859 pools ✅
```

**2. AI Predictions** — Gemini AI generates structured predictions with live data:
```json
{
  "prediction": {
    "predicted_apy": 2.35,
    "current_apy": 2.3,
    "confidence": 0.72,
    "probability_above_threshold": 0.06,
    "prediction_direction": "below",
    "reasoning": "stETH staking yield currently sits at 2.3%, well below the 3.5% threshold..."
  },
  "evidence": {
    "defillama_pools_analyzed": 15,
    "primary_pool": { "project": "lido", "chain": "Ethereum", "tvl_usd": 18700000000 }
  }
}
```

**3. World ID Cloud Verification** — Backend correctly validates proofs:
```json
{ "verified": true, "nullifier_hash": "0x...", "verification_level": "device" }
```

**4. RP Context Generation** — Generates signed contexts for IDKit v4:
```json
{
  "rp_context": {
    "rp_id": "rp_destaker_demo",
    "nonce": "f62de832-7b36-4329-b2ac-165ea07d299a",
    "created_at": 1771769522,
    "expires_at": 1771773122,
    "signature": "e6758133236ffa098404c030703f70cf816a85457ebf85b529e11d3d42db695a"
  }
}
```

**5. CRE Workflow Simulation** — Full orchestration with real blockchain + API + AI:
```json
{
  "execution": { "status": "success", "steps_completed": 5, "total_duration_ms": 1457 },
  "blockchain": { "block_number": 24512926, "chain_id": "1" },
  "external_api": { "source": "DeFiLlama", "total_pools": 18063 },
  "ai_agent": { "model": "google/gemini-2.5-flash-lite", "markets_settled": 3 }
}
```

### Frontend Verification

- ✅ 12 markets display with real-time YES/NO prices from AI predictions
- ✅ Live DeFiLlama data (1,000+ pools tracked indicator)
- ✅ Connect Wallet flow works (MetaMask/WalletConnect simulation)
- ✅ World ID "Verify with World ID" button triggers IDKit v4 widget
- ✅ RP context fetched from backend before widget opens
- ✅ Wallet + verification state persisted in React context
- ✅ Trading panel gates behind wallet connection + World ID verification
- ✅ AI Prediction Panel shows confidence, reasoning, risk factors
- ✅ Batch prediction runs all 12 markets in parallel

### 📸 Product Screenshots

**Homepage — 12 Live Markets with AI-Driven YES/NO Prices:**

The homepage displays all prediction markets with real-time pricing derived from Gemini AI analysis of DeFiLlama yield data. Each market shows YES/NO prices, time remaining, and live data indicators.

**Connect Wallet + World ID Verification Modal:**

Two-step authentication flow: Connect wallet (MetaMask/WalletConnect) → Verify humanity with World ID. Ensures Sybil-resistant trading.

**Market Detail — Trading Panel with AI Predictions:**

Individual market page showing YES/NO pricing, volume, liquidity, current yield (live from DeFiLlama), threshold, and AI prediction panel with confidence scores.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| UI Components | shadcn/ui (Radix primitives) |
| State | React Context, TanStack Query |
| Identity | World ID IDKit v4, Cloud Verification API |
| AI | Gemini 2.5 Flash Lite (via Lovable AI Gateway) |
| Data | DeFiLlama Yields API (18,000+ pools) |
| CRE | Chainlink Runtime Environment Workflow (TypeScript SDK) |
| Backend | Edge Functions (Deno) |
| Database | PostgreSQL with RLS policies |
| Deployment | Lovable Cloud |

---

## 🚀 Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd destaker

# Install dependencies
npm install

# Start the development server
npm run dev
```

> **Note**: Environment variables are managed securely via Lovable Cloud and are never committed to the repository. The `.env` file is listed in `.gitignore`.

### World ID Setup

1. Create a World ID app at [developer.worldcoin.org](https://developer.worldcoin.org)
2. Set your App ID in `src/components/WorldIDVerify.tsx` and `supabase/functions/verify-worldid/index.ts`
3. Configure the action name (`destaker-verify`)

### CRE Workflow Setup

1. Install CRE CLI: `npm install -g @chainlink/cre-cli`
2. Run simulation: `cre workflow simulate destaker-settlement --target staging-settings`
3. Or call the backend edge function directly via API

---

## 📄 License

MIT License — Built for the World ID + Chainlink CRE hackathon.
