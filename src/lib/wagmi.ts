import { http, createConfig } from "wagmi";
import { worldchain, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = "b5e20d234e9814e32ce0b81b31a77499"; // WalletConnect Cloud project ID

export const wagmiConfig = createConfig({
  chains: [sepolia, worldchain],
  connectors: [injected(), walletConnect({ projectId })],
  transports: {
    [sepolia.id]: http(),
    [worldchain.id]: http(),
  },
});
