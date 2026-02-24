import { motion } from "framer-motion";
import { stakingInfo, proposals } from "@/lib/mockData";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Lock, Gift, Vote, CheckCircle2, XCircle, Clock } from "lucide-react";

const Staking = () => {
  const [stakeAmount, setStakeAmount] = useState('');
  const s = stakingInfo;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground mb-1">Stake & Govern</h1>
        <p className="text-xs text-muted-foreground mb-6">Stake DST tokens to earn rewards and participate in governance.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatCard label="Staked DST" value={s.stakedAmount.toLocaleString()} delay={0} />
        <StatCard label="Staking APY" value={`${s.apy}%`} delay={0.05} />
        <StatCard label="Pending Rewards" value={`${s.pendingRewards} DST`} delay={0.1} />
        <StatCard label="Voting Power" value={s.votingPower.toLocaleString()} delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Staking Panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5 glow-border">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Stake DST</h2>
          </div>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Amount to stake"
            className="mb-3 h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <div className="mb-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Lock period</span><span className="text-foreground font-mono">90 days</span></div>
            <div className="flex justify-between"><span>Current APY</span><span className="text-primary font-mono">{s.apy}%</span></div>
            <div className="flex justify-between"><span>Lock expires</span><span className="text-foreground font-mono">{s.lockExpiry}</span></div>
          </div>
          <Button className="w-full text-xs" size="sm">Stake DST</Button>
        </motion.div>

        {/* Rewards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Rewards</h2>
          </div>
          <div className="mb-4 rounded-lg bg-secondary/50 p-4 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Claimable</div>
            <div className="text-2xl font-bold font-mono text-primary">{s.pendingRewards} DST</div>
            <div className="text-[10px] text-muted-foreground mt-1">≈ ${(s.pendingRewards * 1.24).toFixed(2)}</div>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
            <div className="flex justify-between"><span>Trading fee share</span><span className="text-foreground font-mono">$124.50</span></div>
            <div className="flex justify-between"><span>Emission rewards</span><span className="text-foreground font-mono">218 DST</span></div>
            <div className="flex justify-between"><span>LP bonus</span><span className="text-foreground font-mono">12.4%</span></div>
          </div>
          <Button variant="outline" className="w-full text-xs" size="sm">Claim Rewards</Button>
        </motion.div>

        {/* Quick Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Vote className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Governance Power</h2>
          </div>
          <div className="mb-4 rounded-lg bg-secondary/50 p-4 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Voting Power</div>
            <div className="text-2xl font-bold font-mono text-foreground">{s.votingPower.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground mt-1">= staked DST amount</div>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Active proposals</span><span className="text-foreground font-mono">{proposals.filter(p => p.status === 'active').length}</span></div>
            <div className="flex justify-between"><span>Your votes cast</span><span className="text-foreground font-mono">2</span></div>
            <div className="flex justify-between"><span>Delegate</span><span className="text-primary font-mono cursor-pointer">Self</span></div>
          </div>
        </motion.div>
      </div>

      {/* Proposals */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Governance Proposals</h2>
        <div className="space-y-3">
          {proposals.map((prop) => {
            const totalVotes = prop.votesFor + prop.votesAgainst;
            const forPercent = totalVotes > 0 ? (prop.votesFor / totalVotes) * 100 : 0;
            const quorumPercent = Math.min((totalVotes / prop.quorum) * 100, 100);

            return (
              <div key={prop.id} className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">{prop.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{prop.description}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    prop.status === 'active' ? 'bg-primary/15 text-primary' :
                    prop.status === 'passed' ? 'bg-success/15 text-success' :
                    'bg-destructive/15 text-destructive'
                  }`}>
                    {prop.status === 'active' ? <Clock className="h-2.5 w-2.5" /> :
                     prop.status === 'passed' ? <CheckCircle2 className="h-2.5 w-2.5" /> :
                     <XCircle className="h-2.5 w-2.5" />}
                    {prop.status}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>For: {(prop.votesFor / 1e6).toFixed(2)}M</span>
                      <span>Against: {(prop.votesAgainst / 1e6).toFixed(2)}M</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${forPercent}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Quorum</span>
                      <span>{quorumPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{ width: `${quorumPercent}%` }} />
                    </div>
                  </div>
                </div>

                {prop.status === 'active' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1 text-[10px] h-7">Vote For</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-[10px] h-7">Vote Against</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Staking;
