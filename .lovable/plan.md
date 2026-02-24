

# World ID Integration Plan for Destaker

## Overview

Integrate World ID verification into Destaker to provide Sybil-resistant identity for the prediction market. Users will verify with World ID before trading, and the platform will use a "Connect Wallet + Verify Human" flow.

## What Will Change

### 1. Install World ID SDK
- Add `@worldcoin/idkit` package

### 2. Auth Context (`src/contexts/AuthContext.tsx`) -- NEW
- Global React context managing:
  - `walletAddress` (string or null) -- simulated wallet connection
  - `isVerified` (boolean) -- World ID verified
  - `verificationLevel` ("orb" | "device" | null)
  - `nullifierHash` (string or null) -- unique per user
- Functions: `connectWallet()`, `disconnectWallet()`, `setVerified()`

### 3. World ID Verification Component (`src/components/WorldIDVerify.tsx`) -- NEW
- Uses `IDKitWidget` from `@worldcoin/idkit`
- Shows "Verify with World ID" button with World ID branding
- On success, stores proof in AuthContext
- Uses **Cloud verification** (off-chain) via `verifyCloudProof` -- no backend needed for demo, verification happens client-side with the IDKit widget
- Displays verification badge after success

### 4. Connect Wallet Modal (`src/components/ConnectWalletModal.tsx`) -- NEW
- Step 1: "Connect Wallet" -- simulated wallet connection (MetaMask-style UI)
- Step 2: "Verify Humanity" -- World ID verification via IDKit
- Shows connected state with address + verified badge
- Glassmorphism design matching existing UI

### 5. Navbar Updates (`src/components/Navbar.tsx`)
- Replace static "Connect Wallet" button with dynamic state:
  - **Not connected**: "Connect Wallet" button
  - **Connected, not verified**: Truncated address + "Verify" badge
  - **Connected + verified**: Truncated address + green checkmark + "Human" badge
- Clicking opens ConnectWalletModal

### 6. Protected Trading Actions
- MarketDetail.tsx: Trading panel shows "Connect Wallet" or "Verify to Trade" if not authenticated/verified
- Portfolio.tsx: Shows empty state prompting connection if not connected
- Trade buttons disabled with tooltip when unverified

### 7. User Profile Dropdown (`src/components/UserMenu.tsx`) -- NEW
- Dropdown from navbar showing:
  - Wallet address (copyable)
  - Verification status with World ID badge
  - "Disconnect" option

## Technical Details

### World ID Configuration
- **App ID**: Will use a placeholder `app_staging_...` for demo (user provides real one later)
- **Action**: `"destaker-verify"` -- unique action for this app
- **Verification Level**: `device` (lower friction) with option for `orb`
- **Verification**: Cloud-based (off-chain) using `verifyCloudProof`

### IDKit Widget Usage
```tsx
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";

<IDKitWidget
  app_id="app_staging_..."
  action="destaker-verify"
  verification_level={VerificationLevel.Device}
  onSuccess={handleSuccess}
>
  {({ open }) => <button onClick={open}>Verify with World ID</button>}
</IDKitWidget>
```

### Files Modified
| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | NEW - Auth state management |
| `src/components/WorldIDVerify.tsx` | NEW - World ID widget wrapper |
| `src/components/ConnectWalletModal.tsx` | NEW - Wallet + verification modal |
| `src/components/UserMenu.tsx` | NEW - Profile dropdown |
| `src/components/Navbar.tsx` | Update button to show auth state |
| `src/pages/MarketDetail.tsx` | Gate trading behind verification |
| `src/pages/Portfolio.tsx` | Show connect prompt if disconnected |
| `src/App.tsx` | Wrap with AuthProvider |

### World ID App Setup
- You will need to create a World ID app at https://developer.worldcoin.org
- For now, I will use a staging/demo app_id so the UI works
- The IDKit widget will render and show the verification flow
- For production, you replace the app_id with your real one

