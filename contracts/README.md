# Destaker CRE Workflow

This directory contains the Chainlink Runtime Environment (CRE) Workflow
for the Destaker yield prediction market settlement system.

## Workflow Overview

The CRE workflow orchestrates:
1. **Trigger**: Cron schedule (every 30 minutes) or on-chain `SettlementRequested` event
2. **Blockchain Read**: Reads current market state from Ethereum (chain reader)
3. **External API**: Fetches live yield data from DeFiLlama
4. **AI Agent**: Sends data to Gemini AI for settlement determination
5. **Blockchain Write**: Submits signed settlement report on-chain

## Structure

```
cre-workflow/
├── project.yaml              # CRE project configuration
├── destaker-settlement/
│   ├── workflow.yaml          # Workflow-specific config
│   ├── config.staging.json    # Staging configuration
│   ├── main.ts                # CRE workflow entry point
│   ├── defillama.ts           # DeFiLlama API integration
│   ├── gemini.ts              # Gemini AI settlement logic
│   └── types.ts               # Shared type definitions
└── README.md                  # This file
```

## Running the Simulation

### Prerequisites
- CRE CLI installed (`npm install -g @chainlink/cre-cli`)
- Node.js v18+

### Simulate
```bash
cre workflow simulate destaker-settlement --target staging-settings
```

### Deploy to CRE Network
```bash
cre workflow deploy destaker-settlement --target production-settings
```

## Live Simulation

The workflow logic is also deployed as a live edge function at:
```
POST /cre-workflow-simulate
```

This function executes the exact same orchestration logic as the CRE workflow,
providing a live demonstration of the settlement flow.
