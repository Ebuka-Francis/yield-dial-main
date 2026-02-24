import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { ArrowLeft, Clock, TrendingUp, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AIPredictionPanel } from "@/components/AIPredictionPanel";
import { useRealMarkets } from "@/hooks/useRealMarkets";
import { toast } from "sonner";

const MarketDetail = () => {
  const { id } = useParams();
  const { markets } = useRealMarkets();
  const market = markets.find((m) => m.id === id);
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('');
  const { walletAddress, isVerified, setModalOpen } = useAuth();

  if (!market) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Market not found.</p>
        <Link to="/" className="mt-4 inline-block text-primary text-sm">← Back to markets</Link>
      </div>
    );
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const selectedPrice = side === 'YES' ? market.yesPrice : market.noPrice;
  const shares = amount ? (parseFloat(amount) / selectedPrice).toFixed(1) : '0';
  const payout = amount ? (parseFloat(amount) / selectedPrice).toFixed(2) : '0.00';

  const canTrade = walletAddress && isVerified;

  const handleTrade = () => {
    if (!canTrade) return;
    toast.success(`${tradeTab === 'buy' ? 'Bought' : 'Sold'} ${shares} ${side} shares of ${market.asset} at $${(selectedPrice * 100).toFixed(0)}`);
    setAmount('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to markets
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{market.assetIcon}</span>
              <div>
                <h1 className="text-lg font-bold text-foreground">{market.asset}</h1>
                <p className="text-xs text-muted-foreground">{market.condition}</p>
              </div>
              {market.hasPrediction && (
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">AI PRICED</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {market.timeRemaining} remaining</span>
              <span>Settles: {market.settlementDate}</span>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setSide('YES')}
                className={`flex-1 rounded-lg p-4 text-center border transition-all ${
                  side === 'YES'
                    ? 'bg-chart-yes/15 border-chart-yes/40 shadow-md'
                    : 'bg-chart-yes/10 border-chart-yes/20 hover:bg-chart-yes/15'
                }`}
              >
                <div className="text-xs text-chart-yes font-medium mb-1">YES</div>
                <div className="text-2xl font-bold font-mono text-chart-yes">${yesPercent}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{yesPercent}% implied</div>
              </button>
              <button
                onClick={() => setSide('NO')}
                className={`flex-1 rounded-lg p-4 text-center border transition-all ${
                  side === 'NO'
                    ? 'bg-chart-no/15 border-chart-no/40 shadow-md'
                    : 'bg-chart-no/10 border-chart-no/20 hover:bg-chart-no/15'
                }`}
              >
                <div className="text-xs text-chart-no font-medium mb-1">NO</div>
                <div className="text-2xl font-bold font-mono text-chart-no">${noPercent}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{noPercent}% implied</div>
              </button>
            </div>

            <div className="probability-bar mb-2">
              <div className="probability-fill-yes" style={{ width: `${yesPercent}%` }} />
            </div>

            <div className="mt-6 rounded-lg bg-secondary/50 border border-border/50 p-8 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Price history chart</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="24h Volume" value={`$${(market.volume24h / 1000).toFixed(0)}k`} />
            <StatCard label="Liquidity" value={`$${(market.totalLiquidity / 1000).toFixed(0)}k`} />
            <StatCard label="Current Yield" value={`${market.currentYield}%`} />
            <StatCard label="Threshold" value={`${market.threshold}%`} />
          </div>

          {/* AI Prediction Panel */}
          <AIPredictionPanel
            marketId={market.id}
            asset={market.asset}
            threshold={market.threshold}
            settlementDate={market.settlementDate}
          />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Market Details</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Resolution Source</span><span className="text-foreground font-mono">DeFiLlama Oracle</span></div>
              <div className="flex justify-between"><span>Trading Fee</span><span className="text-foreground font-mono">1.5%</span></div>
              <div className="flex justify-between"><span>Settlement</span><span className="text-foreground font-mono">Automatic</span></div>
              <div className="flex justify-between"><span>Collateral</span><span className="text-foreground font-mono">USDC</span></div>
              <div className="flex justify-between"><span>Data Source</span><span className="text-foreground font-mono">DeFiLlama + AI</span></div>
            </div>
          </motion.div>
        </div>

        {/* Trading Panel */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="glass-card p-4 glow-border">
            {!walletAddress ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Connect to Trade</p>
                <p className="text-xs text-muted-foreground text-center">Connect your wallet and verify with World ID to start trading.</p>
                <Button className="w-full text-xs" size="sm" onClick={() => setModalOpen(true)}>
                  Connect Wallet
                </Button>
              </div>
            ) : !isVerified ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <Shield className="h-6 w-6 text-warning" />
                </div>
                <p className="text-sm font-medium text-foreground">Verify to Trade</p>
                <p className="text-xs text-muted-foreground text-center">Complete World ID verification to unlock trading.</p>
                <Button className="w-full text-xs" size="sm" onClick={() => setModalOpen(true)}>
                  Verify Identity
                </Button>
              </div>
            ) : (
              <>
                <div className="flex rounded-md bg-secondary p-0.5 mb-4">
                  <button
                    onClick={() => setTradeTab('buy')}
                    className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors ${tradeTab === 'buy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeTab('sell')}
                    className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors ${tradeTab === 'sell' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    Sell
                  </button>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Outcome</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSide('YES')}
                      className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors border ${
                        side === 'YES' ? 'border-chart-yes bg-chart-yes/15 text-chart-yes' : 'border-border text-muted-foreground'
                      }`}
                    >
                      Yes ${yesPercent}
                    </button>
                    <button
                      onClick={() => setSide('NO')}
                      className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors border ${
                        side === 'NO' ? 'border-chart-no bg-chart-no/15 text-chart-no' : 'border-border text-muted-foreground'
                      }`}
                    >
                      No ${noPercent}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Amount (USDC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div className="mb-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shares</span>
                    <span className="font-mono text-foreground">{shares}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Potential payout</span>
                    <span className="font-mono text-foreground">${payout}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fee (1.5%)</span>
                    <span className="font-mono text-foreground">${amount ? (parseFloat(amount) * 0.015).toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                <Button className="w-full text-xs" size="sm" onClick={handleTrade}>
                  {tradeTab === 'buy' ? 'Buy' : 'Sell'} {side} Shares
                </Button>
              </>
            )}
          </div>

          {/* LP Section */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Provide Liquidity</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Earn trading fees by providing USDC liquidity to this market.</p>
            {canTrade ? (
              <>
                <input
                  type="number"
                  placeholder="USDC amount"
                  className="mb-3 h-9 w-full rounded-md border border-border bg-secondary px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
                <Button variant="outline" className="w-full text-xs" size="sm">
                  Add Liquidity
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-full text-xs" size="sm" onClick={() => setModalOpen(true)}>
                {!walletAddress ? "Connect Wallet" : "Verify to Add LP"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MarketDetail;
