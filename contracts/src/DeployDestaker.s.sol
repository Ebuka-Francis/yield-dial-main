// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MarketRegistry}    from "../src/MarketRegistry.sol";
import {BettingPool}       from "../src/BettingPool.sol";
import {LiquidityPool}     from "../src/LiquidityPool.sol";
import {MarketSettlement}  from "../src/MarketSettlement.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";

contract DeployDestaker is Script {

    address constant MOCK_USDC = 0x1b1823580654b007575923b751984901F57c4c7C;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        console.log("Deployer:  ", deployer);
        console.log("MockUSDC:  ", MOCK_USDC);
        console.log("-------------------------------------------");

        vm.startBroadcast(deployerKey);

        MarketRegistry registry = new MarketRegistry();
        console.log("MarketRegistry:    ", address(registry));

        BettingPool betting = new BettingPool(address(registry));
        console.log("BettingPool:       ", address(betting));

        LiquidityPool liquidity = new LiquidityPool(address(registry));
        console.log("LiquidityPool:     ", address(liquidity));

        MarketSettlement settlement = new MarketSettlement(address(registry), deployer);
        console.log("MarketSettlement:  ", address(settlement));

        RewardDistributor rewards = new RewardDistributor(address(registry), address(betting));
        console.log("RewardDistributor: ", address(rewards));

        registry.setAuthorised(address(betting),    true);
        registry.setAuthorised(address(liquidity),  true);
        registry.setAuthorised(address(settlement), true);
        console.log("All modules authorised.");

        vm.stopBroadcast();

        console.log("-------------------------------------------");
        console.log("Deployment complete. Save these addresses.");
        console.log("-------------------------------------------");
    }
}
