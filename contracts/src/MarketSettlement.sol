// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRegistry {
    enum Outcome { UNRESOLVED, YES, NO }
    function getThreshold(uint256 _marketId) external view returns (uint256);
    function recordSettlement(uint256 _marketId, Outcome _outcome, uint256 _finalApyBps) external;
    function closeMarket(uint256 _marketId) external;
}

contract MarketSettlement {

    IRegistry public registry;
    address   public owner;
    address   public settler;

    event SettlerUpdated(address indexed oldSettler, address indexed newSettler);

    error Unauthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlySettler() {
        if (msg.sender != settler) revert Unauthorized();
        _;
    }

    constructor(address _registry, address _settler) {
        owner    = msg.sender;
        registry = IRegistry(_registry);
        settler  = _settler;
    }

    function setSettler(address _settler) external onlyOwner {
        emit SettlerUpdated(settler, _settler);
        settler = _settler;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function closeMarket(uint256 _marketId) external onlyOwner {
        registry.closeMarket(_marketId);
    }

    function settleMarket(uint256 _marketId, uint256 _finalApyBps) external onlySettler {
        uint256 threshold = registry.getThreshold(_marketId);

        IRegistry.Outcome outcome = _finalApyBps >= threshold
            ? IRegistry.Outcome.YES
            : IRegistry.Outcome.NO;

        registry.recordSettlement(_marketId, outcome, _finalApyBps);
    }
}
