import { useAuth } from "@/contexts/AuthContext";
import { Shield, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  IDKitRequestWidget,
  orbLegacy,
  type IDKitResult,
  type RpContext,
  IDKitErrorCodes,
} from "@worldcoin/idkit";

const APP_ID = "app_135f61bfd908558b3c07fd6580d58192" as `app_${string}`;
const ACTION = "destaker-verify";

/**
 * Inner component that renders once we have a valid RP context.
 * This ensures `orbLegacy()` and the widget are initialized with real data.
 */
const WorldIDWidget = ({
  rpContext,
  onVerified,
}: {
  rpContext: RpContext;
  onVerified: (level: string, nullifierHash: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSuccess = async (result: IDKitResult) => {
    setVerifying(true);
    try {
      const response = result.responses?.[0];
      if (!response) throw new Error("No response in IDKit result");

      // Extract proof fields (supports both v3 and v4 response shapes)
      let proof: string;
      let merkle_root: string;
      let nullifier_hash: string;
      let verification_level = "device";

      if ("merkle_root" in response) {
        // v3 legacy response
        const v3 = response as any;
        proof = v3.proof;
        merkle_root = v3.merkle_root;
        nullifier_hash = v3.nullifier_hash || v3.nullifier;
        verification_level = v3.verification_level || "device";
      } else {
        const v4 = response as any;
        proof = Array.isArray(v4.proof) ? v4.proof[0] : v4.proof;
        merkle_root = Array.isArray(v4.proof) ? v4.proof[4] : "";
        nullifier_hash = v4.nullifier_hash || v4.nullifier;
        verification_level = v4.verification_level || "device";
      }

      // Send to backend for cloud verification
      const { data, error } = await supabase.functions.invoke("verify-worldid", {
        body: { proof, merkle_root, nullifier_hash, verification_level, action: ACTION },
      });

      if (error) throw new Error(error.message || "Verification failed");

      if (data?.verified) {
        onVerified(
          verification_level === "orb" ? "orb" : "device",
          nullifier_hash,
        );
        toast.success("World ID verification successful!");
      } else {
        toast.error(data?.detail || data?.error || "Verification failed");
      }
    } catch (err: any) {
      console.error("Cloud verification error:", err);
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleError = (errorCode: IDKitErrorCodes) => {
    console.error("World ID widget error:", errorCode);
    if (errorCode !== IDKitErrorCodes.UserRejected && errorCode !== IDKitErrorCodes.Cancelled) {
      toast.error("World ID verification failed. Please try again.");
    }
  };

  return (
    <>
      <IDKitRequestWidget
        app_id={APP_ID}
        action={ACTION}
        rp_context={rpContext}
        allow_legacy_proofs={true}
        preset={orbLegacy()}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
        onError={handleError}
        autoClose={true}
      />
      <Button
        onClick={() => setIsOpen(true)}
        disabled={verifying}
        variant="outline"
        className="w-full gap-2 border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10"
      >
        {verifying ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Shield className="h-4 w-4 text-primary" />
        )}
        {verifying ? "Verifying..." : "Verify with World ID"}
      </Button>
    </>
  );
};

export const WorldIDVerify = () => {
  const { isVerified, verificationLevel, setVerified } = useAuth();
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [fetchingRp, setFetchingRp] = useState(false);
  const [rpError, setRpError] = useState(false);

  const fetchRpContext = useCallback(async () => {
    setFetchingRp(true);
    setRpError(false);
    try {
      const { data, error } = await supabase.functions.invoke("worldid-rp-context");
      if (error) throw error;
      setRpContext(data.rp_context);
    } catch (err: any) {
      console.error("Failed to get RP context:", err);
      setRpError(true);
      toast.error("Failed to initialize World ID. Please try again.");
    } finally {
      setFetchingRp(false);
    }
  }, []);

  // Fetch RP context on mount
  useEffect(() => {
    if (!isVerified) {
      fetchRpContext();
    }
  }, [isVerified, fetchRpContext]);

  const handleVerified = (level: string, nullifierHash: string) => {
    setVerified({ level: level as "orb" | "device", nullifierHash });
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Verified Human</p>
          <p className="text-[10px] text-muted-foreground">
            World ID · {verificationLevel === "orb" ? "Orb" : "Device"} verified
          </p>
        </div>
      </div>
    );
  }

  // Show loading while fetching RP context
  if (fetchingRp) {
    return (
      <Button disabled variant="outline" className="w-full gap-2 border-primary/30 bg-primary/5">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Initializing World ID...
      </Button>
    );
  }

  // Show retry if RP context failed
  if (rpError || !rpContext) {
    return (
      <Button
        onClick={fetchRpContext}
        variant="outline"
        className="w-full gap-2 border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10"
      >
        <Shield className="h-4 w-4 text-primary" />
        {rpError ? "Retry World ID" : "Initialize World ID"}
      </Button>
    );
  }

  // Render widget only when we have valid RP context
  return <WorldIDWidget rpContext={rpContext} onVerified={handleVerified} />;
};
