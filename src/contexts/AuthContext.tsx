import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

interface AuthState {
  isVerified: boolean;
  verificationLevel: "orb" | "device" | null;
  nullifierHash: string | null;
}

interface AuthContextType extends AuthState {
  walletAddress: string | undefined;
  isConnected: boolean;
  connectWallet: (connectorIndex?: number) => void;
  disconnectWallet: () => void;
  setVerified: (proof: { level: "orb" | "device"; nullifierHash: string }) => void;
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  connectors: ReturnType<typeof useConnect>["connectors"];
  connectAsync: ReturnType<typeof useConnect>["connectAsync"];
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [authState, setAuthState] = useState<AuthState>({
    isVerified: false,
    verificationLevel: null,
    nullifierHash: null,
  });
  const [isModalOpen, setModalOpen] = useState(false);

  const connectWallet = useCallback(
    (connectorIndex = 0) => {
      const connector = connectors[connectorIndex];
      if (connector) {
        connectAsync({ connector });
      }
    },
    [connectors, connectAsync]
  );

  const disconnectWallet = useCallback(() => {
    disconnect();
    setAuthState({ isVerified: false, verificationLevel: null, nullifierHash: null });
  }, [disconnect]);

  const setVerified = useCallback((proof: { level: "orb" | "device"; nullifierHash: string }) => {
    setAuthState({
      isVerified: true,
      verificationLevel: proof.level,
      nullifierHash: proof.nullifierHash,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        walletAddress: address,
        isConnected,
        ...authState,
        connectWallet,
        disconnectWallet,
        setVerified,
        isModalOpen,
        setModalOpen,
        connectors,
        connectAsync,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
