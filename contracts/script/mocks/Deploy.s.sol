// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import {Script, console} from "forge-std/Script.sol";
// import {DestakerMarket} from "../src/DestakerMarket.sol";

// contract DeployDestaker is Script {

//     address constant USDC = 0x1b1823580654b007575923b751984901F57c4c7C;

//     function run() external {
//         // Load deployer private key from .env
//         uint256 deployerKey = vm.envUint("PRIVATE_KEY");
//         address deployer = vm.addr(deployerKey);

//         console.log("Deploying from:  ", deployer);
//         console.log("Deployer balance:", deployer.balance);

//         vm.startBroadcast(deployerKey);

//         // Deploy — deployer is set as settler initially.
//         // Update settler later via setSettler() once you have your oracle address.
//         DestakerMarket market = new DestakerMarket(deployer);

//         console.log("DestakerMarket deployed at:", address(market));
//         console.log("Owner:  ", market.owner());
//         console.log("Settler:", market.settler());

//         vm.stopBroadcast();
//     }
// }