import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const UserMenu = () => {
  const { walletAddress, isConnected, isVerified, setModalOpen } = useAuth();

  if (!isConnected) {
    return (
      <Button size="sm" className="text-xs" onClick={() => setModalOpen(true)}>
        Connect Wallet
      </Button>
    );
  }

  const truncated = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "";

  return (
    <button
      onClick={() => setModalOpen(true)}
      className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-secondary"
    >
      <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-mono text-foreground">{truncated}</span>
      {isVerified ? (
        <span className="flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          <CheckCircle2 className="h-3 w-3" /> Human
        </span>
      ) : (
        <span className="flex items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
          <AlertTriangle className="h-3 w-3" /> Verify
        </span>
      )}
    </button>
  );
};
