// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {DestakerMarket} from "../src/DestakerMarket.sol";

/// @notice Deploys DestakerMarket to Sepolia and creates the 12 prediction markets.
contract DeployDestaker is Script {
    // ── Sepolia addresses ───────────────────────────────────────
    // USDC on Sepolia (Circle testnet faucet):
    address constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    // World ID Router on Sepolia (see https://docs.world.org/world-id/reference/contracts):
    address constant WORLD_ID_ROUTER_SEPOLIA = 0x469449f251692E0779667583026b5A1E99512157;

    // Destaker's World ID app + action:
    string constant APP_ID = "app_135f61bfd908558b3c07fd6580d58192";
    string constant ACTION_ID = "destaker-verify";
    uint256 constant GROUP_ID = 1; // Orb-verified

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address settler = vm.envAddress("SETTLER_ADDRESS");
        // Chainlink Forwarder address for CRE on-chain writes (set to address(0) to skip).
        address forwarder = vm.envOr("FORWARDER_ADDRESS", address(0));

        vm.startBroadcast(deployerKey);

        DestakerMarket market = new DestakerMarket(
            USDC_SEPOLIA,
            WORLD_ID_ROUTER_SEPOLIA,
            APP_ID,
            ACTION_ID,
            GROUP_ID,
            settler
        );

        if (forwarder != address(0)) {
            market.setForwarder(forwarder);
            console.log("Forwarder set to:", forwarder);
        }

        console.log("DestakerMarket deployed at:", address(market));

        // ── Create the 12 markets matching config.staging.json ──
        // Thresholds are in basis points: 3.5% → 350
        // Settlement dates as unix timestamps (approximate):
        market.createMarket("stETH",      350,  1740700800); // 2026-02-28
        market.createMarket("rETH",       320,  1740787200); // 2026-03-01
        market.createMarket("cbETH",      300,  1741305600); // 2026-03-07
        market.createMarket("mSOL",       700,  1740441600); // 2026-02-25
        market.createMarket("jitoSOL",    750,  1740614400); // 2026-02-27
        market.createMarket("EigenLayer", 500,  1742083200); // 2026-03-15
        market.createMarket("sfrxETH",    400,  1740700800); // 2026-02-28
        market.createMarket("bSOL",       650,  1741046400); // 2026-03-03
        market.createMarket("Aave V3",    500,  1741651200); // 2026-03-10
        market.createMarket("Lido stETH", 400,  1743465600); // 2026-03-31
        market.createMarket("Compound",   300,  1742083200); // 2026-03-15
        market.createMarket("Pendle PT",  600,  1742515200); // 2026-03-20

        vm.stopBroadcast();
    }
}
