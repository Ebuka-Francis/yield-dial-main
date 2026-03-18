// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRegistry {
    enum Outcome { UNRESOLVED, YES, NO }
    function isSettled(uint256 _marketId) external view returns (bool);
    function getToken(uint256 _marketId) external view returns (address);
    function getOutcome(uint256 _marketId) external view returns (Outcome);
    function getTotals(uint256 _marketId) external view
        returns (uint256 totalYes, uint256 totalNo, uint256 totalCollateral);
}

interface IBettingPool {
    function getPosition(uint256 _marketId, address _user)
        external view returns (uint256 yes, uint256 no);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract RewardDistributor {

    IRegistry    public registry;
    IBettingPool public bettingPool;

    mapping(uint256 => mapping(address => bool)) public claimed;

    event RewardClaimed(uint256 indexed marketId, address indexed user, uint256 payout);

    error MarketNotSettled();
    error AlreadyClaimed();
    error NothingToClaim();
    error TransferFailed();

    constructor(address _registry, address _bettingPool) {
        registry    = IRegistry(_registry);
        bettingPool = IBettingPool(_bettingPool);
    }

    function claimReward(uint256 _marketId) external {
        if (!registry.isSettled(_marketId))     revert MarketNotSettled();
        if (claimed[_marketId][msg.sender])      revert AlreadyClaimed();

        IRegistry.Outcome outcome = registry.getOutcome(_marketId);
        (uint256 totalYes, uint256 totalNo, uint256 totalCollateral) = registry.getTotals(_marketId);
        (uint256 yesShares, uint256 noShares) = bettingPool.getPosition(_marketId, msg.sender);

        uint256 userShares;
        uint256 winningPool;

        if (outcome == IRegistry.Outcome.YES) {
            userShares  = yesShares;
            winningPool = totalYes;
        } else {
            userShares  = noShares;
            winningPool = totalNo;
        }

        if (userShares == 0) revert NothingToClaim();

        claimed[_marketId][msg.sender] = true;

        uint256 payout = 0;
        if (winningPool > 0) {
            payout = (totalCollateral * userShares) / winningPool;
        }

        if (payout > 0) {
            address token = registry.getToken(_marketId);
            bool ok = IERC20(token).transfer(msg.sender, payout);
            if (!ok) revert TransferFailed();
        }

        emit RewardClaimed(_marketId, msg.sender, payout);
    }
}
