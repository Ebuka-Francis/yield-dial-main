// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IDestakerTypes} from "./IDestakerTypes.sol";

interface IMarketRegistry is IDestakerTypes {
    function getMarket(uint256 _marketId) external view returns (Market memory);
    function isOpen(uint256 _marketId) external view returns (bool);
    function isSettled(uint256 _marketId) external view returns (bool);
    function recordBet(uint256 _marketId, Outcome _side, uint256 _netAmount) external;
    function closeMarket(uint256 _marketId) external;
    function recordSettlement(uint256 _marketId, Outcome _outcome, uint256 _finalApyBps) external;
}
