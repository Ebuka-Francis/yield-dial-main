import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { WorldIDVerify } from '@/components/WorldIDVerify';
import { Wallet, CheckCircle2, Copy, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMemo } from 'react';

declare global {
   interface Window {
      ethereum?: Record<string, unknown>;
   }
}

const isMobileBrowser = () =>
   typeof navigator !== 'undefined' &&
   /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const isConnectorReady = (connector: any): boolean => {
   // WalletConnect always works via QR / deep-link
   if (connector.id === 'walletConnect' || connector.type === 'walletConnect') {
      return true;
   }
   // Injected / MetaMask need window.ethereum to exist
   if (
      connector.id === 'injected' ||
      connector.type === 'injected' ||
      connector.id === 'metaMask'
   ) {
      return (
         typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
      );
   }
   // Trust wagmi's own ready flag when present
   if ('ready' in connector) {
      return connector.ready;
   }
   // On mobile, skip connectors whose provider is undefined
   try {
      if (connector.provider === undefined && isMobileBrowser()) {
         return false;
      }
   } catch {
      return false;
   }
   return true;
};

export const ConnectWalletModal = () => {
   const {
      walletAddress,
      isConnected,
      isVerified,
      disconnectWallet,
      isModalOpen,
      setModalOpen,
      connectors,
      connectAsync,
      isPending,
   } = useAuth();

   const availableConnectors = useMemo(
      () => connectors.filter(isConnectorReady),
      [connectors],
   );

   const handleConnect = async (connectorIndex: number) => {
      const connector = availableConnectors[connectorIndex];
      if (!connector) return;

      try {
         await connectAsync({ connector });
         toast.success(`Connected via ${connector.name}`);
      } catch (err: any) {
         console.error('Wallet connection error:', err);

         if (err?.code === 4001 || err?.message?.includes('User rejected'))
            return;

         if (
            err instanceof TypeError &&
            err.message.includes('Cannot read properties of undefined')
         ) {
            toast.error(
               `${connector.name} is not available in this browser. Try WalletConnect or open this page inside your wallet's browser.`,
            );
            return;
         }

         toast.error(
            err.shortMessage || err.message || 'Failed to connect wallet',
         );
      }
   };

   const handleCopy = () => {
      if (walletAddress) {
         navigator.clipboard.writeText(walletAddress);
         toast.success('Address copied');
      }
   };

   const handleDisconnect = () => {
      disconnectWallet();
      setModalOpen(false);
      toast.info('Wallet disconnected');
   };

   const truncated = walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : '';

   return (
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
         <DialogContent className="glass-card border-border/50 sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="text-foreground">
                  {isConnected ? 'Your Account' : 'Connect Wallet'}
               </DialogTitle>
            </DialogHeader>

            {!isConnected ? (
               <div className="space-y-3 py-2">
                  <p className="text-xs text-muted-foreground">
                     Connect your wallet to trade on prediction markets.
                  </p>

                  {availableConnectors.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-4">
                        No wallet detected. Install MetaMask or use
                        WalletConnect.
                     </p>
                  ) : (
                     availableConnectors.map((connector, index) => (
                        <Button
                           key={connector.uid}
                           onClick={() => handleConnect(index)}
                           disabled={isPending}
                           variant={index === 0 ? 'default' : 'outline'}
                           className="w-full gap-2"
                        >
                           {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                              <Wallet className="h-4 w-4" />
                           )}
                           {isPending
                              ? 'Connecting...'
                              : `Connect ${connector.name}`}
                        </Button>
                     ))
                  )}

                  {isMobileBrowser() && (
                     <p className="text-[10px] text-center text-muted-foreground pt-1">
                        On mobile, use WalletConnect or open this app inside
                        your wallet's built-in browser.
                     </p>
                  )}
               </div>
            ) : (
               <div className="space-y-4 py-2">
                  {/* Address */}
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
                     <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                           <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                           <p className="text-sm font-mono font-medium text-foreground">
                              {truncated}
                           </p>
                           <p className="text-[10px] text-muted-foreground">
                              Connected
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={handleCopy}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                     >
                        <Copy className="h-4 w-4" />
                     </button>
                  </div>

                  {/* Verification Status */}
                  <div>
                     <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        Identity Verification
                     </p>
                     {isVerified ? (
                        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                           <CheckCircle2 className="h-5 w-5 text-primary" />
                           <div>
                              <p className="text-sm font-semibold text-foreground">
                                 Verified Human
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                 Sybil-resistant · World ID
                              </p>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           <p className="text-xs text-muted-foreground">
                              Verify your humanity to unlock trading.
                           </p>
                           <WorldIDVerify />
                        </div>
                     )}
                  </div>

                  {/* Disconnect */}
                  <Button
                     variant="ghost"
                     onClick={handleDisconnect}
                     className="w-full gap-2 text-destructive hover:text-destructive"
                  >
                     <LogOut className="h-4 w-4" />
                     Disconnect
                  </Button>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
};
