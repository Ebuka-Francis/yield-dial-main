// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Shared enums and structs used across all Destaker contracts.
/// @dev asset is bytes32 instead of string to avoid dynamic-type ABI issues
///      on chains with limited EVM support. Use bytes32(bytes("stETH")) to encode,
///      and string(abi.encodePacked(asset)) to decode on the frontend.
interface IDestakerTypes {

    enum MarketStatus { OPEN, CLOSED, SETTLED }
    enum Outcome      { UNRESOLVED, YES, NO }

    struct Market {
        uint256      marketId;
        bytes32      asset;          // e.g. bytes32(bytes("stETH"))
        uint256      thresholdBps;   // 350 = 3.50% APY
        uint256      startTime;
        uint256      endTime;
        uint256      settlementTime;
        address      token;          // stablecoin used for trading
        uint256      totalYesShares;
        uint256      totalNoShares;
        uint256      totalCollateral;
        MarketStatus status;
        Outcome      outcome;
        uint256      finalApyBps;
        uint256      createdAt;
        uint256      settledAt;
    }
}
