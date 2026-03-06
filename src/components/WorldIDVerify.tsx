import { useAuth } from '@/contexts/AuthContext';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
   IDKitRequestWidget,
   orbLegacy,
   type IDKitResult,
   type RpContext,
   IDKitErrorCodes,
} from '@worldcoin/idkit';

const APP_ID = 'app_135f61bfd908558b3c07fd6580d58192' as const;
const ACTION = 'Cloud-Verify';

export const WorldIDVerify = () => {
   const { isVerified, verificationLevel, setVerified } = useAuth();
   const [isOpen, setIsOpen] = useState(false);
   const [verifying, setVerifying] = useState(false);
   const [rpContext, setRpContext] = useState<RpContext | null>(null);
   const [fetchingRp, setFetchingRp] = useState(false);
   const [rpError, setRpError] = useState(false);

   const fetchRpContext = useCallback(async () => {
      setFetchingRp(true);
      setRpError(false);
      try {
         const { data, error } =
            await supabase.functions.invoke('worldid-rp-context');
         console.log('rpContext response:', JSON.stringify(data, null, 2));
         console.log('rpContext error:', error);
         if (error) throw error;
         setRpContext(data.rp_context);
      } catch (err: any) {
         console.error('Failed to get RP context:', err);
         setRpError(true);
         toast.error('Failed to initialize World ID. Please try again.');
      } finally {
         setFetchingRp(false);
      }
   }, []);

   useEffect(() => {
      if (!isVerified) {
         fetchRpContext();
      }
   }, [isVerified, fetchRpContext]);

   const handleSuccess = async (result: IDKitResult) => {
      setVerifying(true);
      try {
         const response = result.responses?.[0] as any;
         if (!response) throw new Error('No response in IDKit result');

         const proof = response.proof;
         const merkle_root = response.merkle_root ?? '';
         const nullifier_hash = response.nullifier_hash ?? response.nullifier;
         const verification_level = response.verification_level ?? 'device';

         const { data, error } = await supabase.functions.invoke(
            'verify-worldid',
            {
               body: {
                  proof,
                  merkle_root,
                  nullifier_hash,
                  verification_level,
                  action: ACTION,
               },
            },
         );

         if (error) throw new Error(error.message || 'Verification failed');

         if (data?.verified) {
            setVerified({
               level: verification_level === 'orb' ? 'orb' : 'device',
               nullifierHash: nullifier_hash,
            });
            toast.success('World ID verification successful!');
         } else {
            toast.error(data?.detail || data?.error || 'Verification failed');
         }
      } catch (err: any) {
         console.error('Cloud verification error:', err);
         toast.error(err.message || 'Verification failed');
      } finally {
         setVerifying(false);
      }
   };

   const handleError = (errorCode: IDKitErrorCodes) => {
      console.error('World ID widget error:', errorCode);
      if (
         errorCode !== IDKitErrorCodes.UserRejected &&
         errorCode !== IDKitErrorCodes.Cancelled
      ) {
         toast.error('World ID verification failed. Please try again.');
      }
   };

   // Already verified
   if (isVerified) {
      return (
         <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
               <p className="text-sm font-semibold text-foreground">
                  Verified Human
               </p>
               <p className="text-[10px] text-muted-foreground">
                  World ID · {verificationLevel === 'orb' ? 'Orb' : 'Device'}{' '}
                  verified
               </p>
            </div>
         </div>
      );
   }

   // Loading RP context
   if (fetchingRp) {
      return (
         <Button
            disabled
            variant="outline"
            className="w-full gap-2 border-primary/30 bg-primary/5"
         >
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Initializing World ID...
         </Button>
      );
   }

   // RP context failed
   if (rpError || !rpContext) {
      return (
         <Button
            onClick={fetchRpContext}
            variant="outline"
            className="w-full gap-2 border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10"
         >
            <Shield className="h-4 w-4 text-primary" />
            {rpError ? 'Retry World ID' : 'Initialize World ID'}
         </Button>
      );
   }

   // Ready
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
            {verifying ? 'Verifying...' : 'Verify with World ID'}
         </Button>
      </>
   );
};
