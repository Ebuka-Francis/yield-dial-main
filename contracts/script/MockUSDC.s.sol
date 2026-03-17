// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployDestaker is Script {
    // ── Config ────────────────────────────────────────────────
    // Polkadot Hub TestNet USDC (replace with real address once confirmed)
    // For now using a placeholder — deploy a MockUSDC first if needed

    function run() external {
        // Load deployer private key from .env
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);


        MockUSDC market = new MockUSDC();

        vm.stopBroadcast();
    }
}