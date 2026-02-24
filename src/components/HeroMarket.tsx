import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, ArrowUpRight } from "lucide-react";
import type { YieldMarket } from "@/lib/mockData";

interface HeroMarketProps {
  market: YieldMarket;
}

// Generate price history
const generatePriceHistory = () => {
  const points: { time: string; yes: number; no: number; volume: number }[] = [];
  let yesPrice = 0.32;
  const times = [
    "12:00am", "2:00am", "4:00am", "6:00am", "8:00am", "10:00am",
    "12:00pm", "2:00pm", "4:00pm", "6:00pm", "8:00pm", "10:00pm",
    "11:30pm",
  ];
  times.forEach((time) => {
    const momentum = Math.random() > 0.45 ? 1 : -1;
    const volatility = 0.03 + Math.random() * 0.06;
    yesPrice = Math.max(0.12, Math.min(0.88, yesPrice + momentum * volatility));
    points.push({
      time,
      yes: yesPrice,
      no: 1 - yesPrice,
      volume: Math.floor(5000 + Math.random() * 40000),
    });
  });
  points[points.length - 1].yes = 0.42;
  points[points.length - 1].no = 0.58;
  return points;
};

const recentTrades = [
  { amount: 2400, side: "YES" as const },
  { amount: 850, side: "NO" as const },
  { amount: 5100, side: "YES" as const },
  { amount: 1200, side: "NO" as const },
  { amount: 3300, side: "YES" as const },
  { amount: 720, side: "NO" as const },
  { amount: 4800, side: "YES" as const },
  { amount: 1900, side: "NO" as const },
];

// Animated ticker number component
const TickerNumber = ({ value, prefix = "$", className = "" }: { value: number; prefix?: string; className?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 3;
      setDisplayValue((prev) => {
        const next = Math.max(1, Math.min(99, Math.round(prev + delta)));
        if (next > prev) setFlash("up");
        else if (next < prev) setFlash("down");
        return next;
      });
    }, 1500 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
  }, [flash]);

  return (
    <span className={`inline-flex items-baseline transition-colors duration-300 ${
      flash === "up" ? "text-chart-yes" : flash === "down" ? "text-chart-no" : ""
    } ${className}`}>
      {prefix}{displayValue}
    </span>
  );
};

// Live volume ticker
const VolumeTicker = ({ base }: { base: number }) => {
  const [vol, setVol] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      setVol((prev) => prev + Math.floor(Math.random() * 500 + 50));
    }, 2000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono">${(vol / 1000).toFixed(1)}k vol</span>;
};

// Live liquidity ticker
const LiquidityTicker = ({ base }: { base: number }) => {
  const [liq, setLiq] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.45) * 2000;
      setLiq((prev) => Math.max(base * 0.9, prev + delta));
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [base]);

  return <span className="font-mono">${(liq / 1000).toFixed(1)}k liq</span>;
};

export const HeroMarket = ({ market }: HeroMarketProps) => {
  const [priceHistory, setPriceHistory] = useState(generatePriceHistory);
  const [visibleTrades, setVisibleTrades] = useState<typeof recentTrades>([]);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [liveYesPrice, setLiveYesPrice] = useState(Math.round(market.yesPrice * 100));
  const [liveNoPrice, setLiveNoPrice] = useState(Math.round(market.noPrice * 100));
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const tradeIndex = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Continuously tick the main YES/NO prices
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveYesPrice((prev) => {
        const delta = (Math.random() - 0.47) * 2;
        const next = Math.max(5, Math.min(95, Math.round(prev + delta)));
        if (next > prev) setPriceFlash("up");
        else if (next < prev) setPriceFlash("down");
        setLiveNoPrice(100 - next);
        return next;
      });
    }, 1200 + Math.random() * 800);
    return () => clearInterval(interval);
  }, []);

  // Clear price flash
  useEffect(() => {
    if (priceFlash) {
      const t = setTimeout(() => setPriceFlash(null), 350);
      return () => clearTimeout(t);
    }
  }, [priceFlash]);

  // Continuously add new data points to chart
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory((prev) => {
        const last = prev[prev.length - 1];
        const momentum = Math.random() > 0.45 ? 1 : -1;
        const vol = 0.02 + Math.random() * 0.04;
        const newYes = Math.max(0.12, Math.min(0.88, last.yes + momentum * vol));
        const newPoint = {
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          yes: newYes,
          no: 1 - newYes,
          volume: Math.floor(5000 + Math.random() * 40000),
        };
        const updated = [...prev.slice(-12), newPoint];
        return updated;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Animate trades appearing
  useEffect(() => {
    const interval = setInterval(() => {
      const idx = tradeIndex.current;
      if (idx < recentTrades.length) {
        tradeIndex.current = idx + 1;
        setVisibleTrades((prev) => [...prev, recentTrades[idx]]);
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // SVG chart dimensions
  const chartW = 560;
  const chartH = 200;
  const padX = 0;
  const padY = 16;

  const toX = useCallback(
    (i: number) => padX + (i / (priceHistory.length - 1)) * (chartW - padX * 2),
    [priceHistory.length]
  );
  const toY = useCallback(
    (val: number) => padY + (1 - val) * (chartH - padY * 2),
    []
  );

  // Smooth curve
  const buildSmoothPath = useCallback(() => {
    const pts = priceHistory.map((p, i) => ({ x: toX(i), y: toY(p.yes) }));
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [priceHistory, toX, toY]);

  const smoothPath = buildSmoothPath();
  const lastPt = priceHistory[priceHistory.length - 1];
  const areaPath = `${smoothPath} L ${toX(priceHistory.length - 1)} ${chartH} L ${toX(0)} ${chartH} Z`;

  const getTrendAtPoint = (i: number) => {
    if (i === 0) return priceHistory[1].yes >= priceHistory[0].yes ? "up" : "down";
    return priceHistory[i].yes >= priceHistory[i - 1].yes ? "up" : "down";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Link
        to={`/market/${market.id}`}
        className="group block overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-[var(--shadow-glow)]"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">{market.assetIcon}</span>
            <h2 className="text-sm font-semibold text-foreground">
              {market.asset} Yield Prediction APR {market.currentYield}% at Epoch End
            </h2>
            <Flame className="h-3.5 w-3.5 text-warning" />
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-yes opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-yes" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-chart-yes">
              Live
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left: Market info */}
          <div className="flex-1 p-5">
            {/* Big live ticking price */}
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {market.condition}
              </div>
              <div className="flex items-baseline gap-3">
                <motion.span
                  key={liveYesPrice}
                  initial={{ y: priceFlash === "up" ? 4 : -4, opacity: 0.6 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`text-4xl font-black font-mono transition-colors duration-300 ${
                    priceFlash === "up" ? "text-chart-yes" : priceFlash === "down" ? "text-chart-no" : "text-chart-yes"
                  }`}
                >
                  ${liveYesPrice}
                </motion.span>
                <span className="text-xs text-chart-yes font-medium">YES</span>
                <span className="mx-2 text-muted-foreground/40">|</span>
                <motion.span
                  key={liveNoPrice}
                  initial={{ y: priceFlash === "down" ? 4 : -4, opacity: 0.6 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold font-mono text-chart-no"
                >
                  ${liveNoPrice}
                </motion.span>
                <span className="text-xs text-chart-no font-medium">NO</span>
              </div>
            </div>


            {/* Volume - live ticking */}
            <div className="mb-4 text-xs text-muted-foreground">
              <VolumeTicker base={market.volume24h} /> · {market.timeRemaining} remaining
            </div>

            {/* Insight */}
            <div className="rounded-lg bg-secondary/30 p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Insight
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">·</span>
              <span className="ml-1 text-[11px] leading-relaxed text-secondary-foreground">
                {market.asset} staking yield currently sits at {market.currentYield}%,
                {market.currentYield >= market.threshold ? " above " : " below "}
                the {market.threshold}% threshold. Market participants are pricing in a{" "}
                {liveYesPrice}% probability of exceeding the target by settlement on{" "}
                {new Date(market.settlementDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                .
              </span>
            </div>
          </div>

          {/* Right: Interactive Chart - live updating */}
          <div className="relative flex-1 border-t border-border/30 p-5 lg:border-l lg:border-t-0">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full cursor-crosshair"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((v) => (
                <line
                  key={v}
                  x1={0}
                  y1={toY(v)}
                  x2={chartW}
                  y2={toY(v)}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                  strokeDasharray="4 4"
                  opacity={0.3}
                />
              ))}

              {/* Y axis labels - live */}
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <text
                  key={v}
                  x={chartW - 2}
                  y={toY(v) - 4}
                  textAnchor="end"
                  fill="hsl(var(--muted-foreground))"
                  fontSize={8}
                  opacity={0.5}
                >
                  ${Math.round(v * 100)}
                </text>
              ))}

              {/* Area gradient */}
              <defs>
                <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-yes))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--chart-yes))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--chart-yes))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--chart-yes))" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d={areaPath} fill="url(#heroAreaGrad)" />

              {/* Main line with glow - updates live */}
              <path
                d={smoothPath}
                fill="none"
                stroke="url(#heroLineGrad)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                style={{ transition: "d 0.5s ease" }}
              />

              {/* Data points */}
              {priceHistory.map((p, i) => {
                const trend = getTrendAtPoint(i);
                return (
                  <g key={i}>
                    <rect
                      x={toX(i) - (chartW / priceHistory.length) / 2}
                      y={0}
                      width={chartW / priceHistory.length}
                      height={chartH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredPoint(i)}
                    />

                    <circle
                      cx={toX(i)}
                      cy={toY(p.yes)}
                      r={hoveredPoint === i ? 5 : 2.5}
                      fill={trend === "up" ? "hsl(var(--chart-yes))" : "hsl(var(--chart-no))"}
                      stroke={hoveredPoint === i ? "hsl(var(--background))" : "none"}
                      strokeWidth={hoveredPoint === i ? 2 : 0}
                      style={{ transition: "cy 0.5s ease, r 0.15s ease" }}
                    />

                    {hoveredPoint === i && (
                      <>
                        <line
                          x1={toX(i)} y1={0} x2={toX(i)} y2={chartH}
                          stroke="hsl(var(--muted-foreground))" strokeWidth={0.5}
                          strokeDasharray="3 3" opacity={0.5}
                        />
                        <line
                          x1={0} y1={toY(p.yes)} x2={chartW} y2={toY(p.yes)}
                          stroke="hsl(var(--muted-foreground))" strokeWidth={0.5}
                          strokeDasharray="3 3" opacity={0.3}
                        />
                        <motion.circle
                          cx={toX(i)} cy={toY(p.yes)} r={10}
                          fill="none"
                          stroke={trend === "up" ? "hsl(var(--chart-yes))" : "hsl(var(--chart-no))"}
                          strokeWidth={1}
                          initial={{ scale: 0.5, opacity: 0.8 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Animated end pulse */}
              <motion.circle
                cx={toX(priceHistory.length - 1)}
                cy={toY(lastPt.yes)}
                r={6}
                fill="none"
                stroke="hsl(var(--chart-yes))"
                strokeWidth={1.5}
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* X axis labels */}
              {priceHistory.map((p, i) =>
                i % 2 === 0 ? (
                  <text
                    key={`label-${i}`}
                    x={toX(i)}
                    y={chartH - 2}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize={7}
                    opacity={0.4}
                  >
                    {p.time}
                  </text>
                ) : null
              )}
            </svg>

            {/* Hover tooltip */}
            <AnimatePresence>
              {hoveredPoint !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-3 left-5 rounded-lg bg-card border border-border/50 px-3 py-2 shadow-lg"
                >
                  <div className="text-[10px] text-muted-foreground mb-1">{priceHistory[hoveredPoint].time}</div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${getTrendAtPoint(hoveredPoint) === "up" ? "bg-chart-yes" : "bg-chart-no"}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {getTrendAtPoint(hoveredPoint) === "up" ? "▲ Rising" : "▼ Falling"}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-chart-yes">
                    Yes ${Math.round(priceHistory[hoveredPoint].yes * 100)}
                  </div>
                  <div className="text-xs font-mono font-bold text-chart-no">
                    No ${Math.round(priceHistory[hoveredPoint].no * 100)}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                    Vol: ${priceHistory[hoveredPoint].volume.toLocaleString()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* End labels - live ticking */}
            <div className="absolute right-6 top-6 text-right">
              <div>
                <div className="text-[10px] text-chart-yes font-medium">{market.asset}</div>
                <TickerNumber value={liveYesPrice} className="text-lg font-bold font-mono text-chart-yes" />
              </div>
              <div className="mt-1">
                <div className="text-[10px] text-chart-no font-medium">Below</div>
                <TickerNumber value={liveNoPrice} className="text-lg font-bold font-mono text-chart-no" />
              </div>
            </div>

            {/* Trade bubbles */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <AnimatePresence>
                {visibleTrades.map((trade, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
                      trade.side === "YES"
                        ? "bg-chart-yes/10 text-chart-yes"
                        : "bg-chart-no/10 text-chart-no"
                    }`}
                  >
                    + ${trade.amount.toLocaleString()}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom CTA with live liquidity */}
        <div className="flex items-center justify-between border-t border-border/30 px-5 py-2.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-3">
            Trade this market → <LiquidityTicker base={market.totalLiquidity} />
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
};
