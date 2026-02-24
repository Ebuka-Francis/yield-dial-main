import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  delay?: number;
}

export const StatCard = ({ label, value, sub, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-card p-4"
  >
    <div className="stat-label mb-1">{label}</div>
    <div className="stat-value text-foreground">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </motion.div>
);
