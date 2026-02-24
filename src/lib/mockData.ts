export interface YieldMarket {
  id: string;
  asset: string;
  assetIcon: string;
  condition: string;
  threshold: number;
  currentYield: number;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  totalLiquidity: number;
  settlementDate: string;
  timeRemaining: string;
  category: 'eth-lsd' | 'sol-lsd' | 'defi-yield' | 'restaking';
  trending: boolean;
  resolved: boolean;
}

export interface Position {
  id: string;
  marketId: string;
  asset: string;
  condition: string;
  side: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface LPPosition {
  id: string;
  marketId: string;
  asset: string;
  deposited: number;
  currentValue: number;
  feesEarned: number;
  apy: number;
}

export interface StakingInfo {
  stakedAmount: number;
  pendingRewards: number;
  apy: number;
  votingPower: number;
  lockExpiry: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  endDate: string;
}

export const markets: YieldMarket[] = [
  {
    id: '001',
    asset: 'stETH',
    assetIcon: '◆',
    condition: 'APR > 3.5% at epoch end?',
    threshold: 3.5,
    currentYield: 3.42,
    yesPrice: 0.42,
    noPrice: 0.58,
    volume24h: 284500,
    totalLiquidity: 1250000,
    settlementDate: '2026-02-28',
    timeRemaining: '7d 4h',
    category: 'eth-lsd',
    trending: true,
    resolved: false,
  },
  {
    id: '002',
    asset: 'rETH',
    assetIcon: '⟐',
    condition: 'APR > 3.2% next epoch?',
    threshold: 3.2,
    currentYield: 3.18,
    yesPrice: 0.38,
    noPrice: 0.62,
    volume24h: 156000,
    totalLiquidity: 890000,
    settlementDate: '2026-03-01',
    timeRemaining: '8d 12h',
    category: 'eth-lsd',
    trending: false,
    resolved: false,
  },
  {
    id: '003',
    asset: 'cbETH',
    assetIcon: '●',
    condition: 'APR > 3.0% by March?',
    threshold: 3.0,
    currentYield: 3.05,
    yesPrice: 0.65,
    noPrice: 0.35,
    volume24h: 98200,
    totalLiquidity: 540000,
    settlementDate: '2026-03-07',
    timeRemaining: '14d 8h',
    category: 'eth-lsd',
    trending: false,
    resolved: false,
  },
  {
    id: '004',
    asset: 'mSOL',
    assetIcon: '◎',
    condition: 'APR > 7.0% at epoch end?',
    threshold: 7.0,
    currentYield: 7.24,
    yesPrice: 0.72,
    noPrice: 0.28,
    volume24h: 412000,
    totalLiquidity: 1680000,
    settlementDate: '2026-02-25',
    timeRemaining: '4d 6h',
    category: 'sol-lsd',
    trending: true,
    resolved: false,
  },
  {
    id: '005',
    asset: 'jitoSOL',
    assetIcon: '◈',
    condition: 'APR > 7.5% next epoch?',
    threshold: 7.5,
    currentYield: 7.68,
    yesPrice: 0.61,
    noPrice: 0.39,
    volume24h: 328000,
    totalLiquidity: 1120000,
    settlementDate: '2026-02-27',
    timeRemaining: '6d 2h',
    category: 'sol-lsd',
    trending: true,
    resolved: false,
  },
  {
    id: '006',
    asset: 'EigenLayer',
    assetIcon: '▲',
    condition: 'Restaking APR > 5% by March?',
    threshold: 5.0,
    currentYield: 4.82,
    yesPrice: 0.35,
    noPrice: 0.65,
    volume24h: 520000,
    totalLiquidity: 2100000,
    settlementDate: '2026-03-15',
    timeRemaining: '22d 8h',
    category: 'restaking',
    trending: true,
    resolved: false,
  },
  {
    id: '007',
    asset: 'sfrxETH',
    assetIcon: '◇',
    condition: 'APR > 4.0% at epoch end?',
    threshold: 4.0,
    currentYield: 3.91,
    yesPrice: 0.44,
    noPrice: 0.56,
    volume24h: 87000,
    totalLiquidity: 420000,
    settlementDate: '2026-02-28',
    timeRemaining: '7d 4h',
    category: 'eth-lsd',
    trending: false,
    resolved: false,
  },
  {
    id: '008',
    asset: 'bSOL',
    assetIcon: '◉',
    condition: 'APR > 6.5% next epoch?',
    threshold: 6.5,
    currentYield: 6.72,
    yesPrice: 0.58,
    noPrice: 0.42,
    volume24h: 145000,
    totalLiquidity: 680000,
    settlementDate: '2026-03-03',
    timeRemaining: '10d 1h',
    category: 'sol-lsd',
    trending: false,
    resolved: false,
  },
  {
    id: '009',
    asset: 'Aave V3',
    assetIcon: '👻',
    condition: 'USDC Supply APY > 5% by March?',
    threshold: 5.0,
    currentYield: 4.78,
    yesPrice: 0.39,
    noPrice: 0.61,
    volume24h: 378000,
    totalLiquidity: 1540000,
    settlementDate: '2026-03-10',
    timeRemaining: '17d 6h',
    category: 'defi-yield',
    trending: true,
    resolved: false,
  },
  {
    id: '010',
    asset: 'Lido stETH',
    assetIcon: '🔷',
    condition: 'Staking APR > 4.0% Q1 end?',
    threshold: 4.0,
    currentYield: 3.85,
    yesPrice: 0.33,
    noPrice: 0.67,
    volume24h: 256000,
    totalLiquidity: 1180000,
    settlementDate: '2026-03-31',
    timeRemaining: '38d 2h',
    category: 'defi-yield',
    trending: false,
    resolved: false,
  },
  {
    id: '011',
    asset: 'Compound',
    assetIcon: '🟢',
    condition: 'ETH Borrow rate < 3% by March?',
    threshold: 3.0,
    currentYield: 3.22,
    yesPrice: 0.45,
    noPrice: 0.55,
    volume24h: 189000,
    totalLiquidity: 920000,
    settlementDate: '2026-03-15',
    timeRemaining: '22d 8h',
    category: 'defi-yield',
    trending: false,
    resolved: false,
  },
  {
    id: '012',
    asset: 'Pendle PT',
    assetIcon: '⚡',
    condition: 'Fixed yield > 6% on stETH pool?',
    threshold: 6.0,
    currentYield: 5.84,
    yesPrice: 0.41,
    noPrice: 0.59,
    volume24h: 445000,
    totalLiquidity: 1890000,
    settlementDate: '2026-03-20',
    timeRemaining: '27d 4h',
    category: 'defi-yield',
    trending: true,
    resolved: false,
  },
];

export const positions: Position[] = [
  {
    id: 'p1',
    marketId: '001',
    asset: 'stETH',
    condition: 'APR > 3.5%',
    side: 'NO',
    shares: 500,
    avgPrice: 0.52,
    currentPrice: 0.58,
    pnl: 30,
    pnlPercent: 11.5,
  },
  {
    id: 'p2',
    marketId: '004',
    asset: 'mSOL',
    condition: 'APR > 7.0%',
    side: 'YES',
    shares: 1000,
    avgPrice: 0.65,
    currentPrice: 0.72,
    pnl: 70,
    pnlPercent: 10.8,
  },
  {
    id: 'p3',
    marketId: '006',
    asset: 'EigenLayer',
    condition: 'Restaking APR > 5%',
    side: 'YES',
    shares: 300,
    avgPrice: 0.40,
    currentPrice: 0.35,
    pnl: -15,
    pnlPercent: -12.5,
  },
];

export const lpPositions: LPPosition[] = [
  { id: 'lp1', marketId: '001', asset: 'stETH', deposited: 5000, currentValue: 5120, feesEarned: 120, apy: 14.2 },
  { id: 'lp2', marketId: '005', asset: 'jitoSOL', deposited: 3000, currentValue: 3085, feesEarned: 85, apy: 18.6 },
];

export const stakingInfo: StakingInfo = {
  stakedAmount: 12500,
  pendingRewards: 342,
  apy: 22.4,
  votingPower: 12500,
  lockExpiry: '2026-06-15',
};

export const proposals: Proposal[] = [
  {
    id: 'gov1',
    title: 'Increase trading fee to 1.5%',
    description: 'Proposal to adjust trading fees from 1% to 1.5% to increase protocol revenue and LP incentives.',
    status: 'active',
    votesFor: 1250000,
    votesAgainst: 480000,
    quorum: 2000000,
    endDate: '2026-02-25',
  },
  {
    id: 'gov2',
    title: 'Add wstETH markets',
    description: 'List wstETH yield prediction markets with 7-day and 30-day settlement epochs.',
    status: 'active',
    votesFor: 890000,
    votesAgainst: 120000,
    quorum: 2000000,
    endDate: '2026-02-27',
  },
  {
    id: 'gov3',
    title: 'Treasury buyback program',
    description: 'Allocate 10% of treasury revenue to DST buybacks on a monthly basis.',
    status: 'passed',
    votesFor: 2100000,
    votesAgainst: 350000,
    quorum: 2000000,
    endDate: '2026-02-15',
  },
];

export const categoryLabels: Record<string, string> = {
  'eth-lsd': 'ETH LSDs',
  'sol-lsd': 'SOL LSDs',
  'defi-yield': 'DeFi Yield',
  'restaking': 'Restaking',
};
