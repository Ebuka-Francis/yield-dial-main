// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRegistry {
    function isOpen(uint256 _marketId) external view returns (bool);
    function getToken(uint256 _marketId) external view returns (address);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract LiquidityPool {

    IRegistry public registry;

    mapping(uint256 => uint256)                     public lpPool;
    mapping(uint256 => uint256)                     public lpTotalShares;
    mapping(uint256 => mapping(address => uint256)) public lpUserShares;
    mapping(uint256 => uint256)                     public lpFees;

    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 shares);
    event LiquidityRemoved(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 shares);

    error MarketNotOpen();
    error InvalidAmount();
    error TransferFailed();

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    function provideLiquidity(uint256 _marketId, uint256 _amount) external {
        if (!registry.isOpen(_marketId)) revert MarketNotOpen();
        if (_amount == 0) revert InvalidAmount();

        address token = registry.getToken(_marketId);
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), _amount);
        if (!ok) revert TransferFailed();

        uint256 shares;
        if (lpTotalShares[_marketId] == 0) {
            shares = _amount;
        } else {
            shares = (_amount * lpTotalShares[_marketId]) / lpPool[_marketId];
        }

        lpPool[_marketId]                   += _amount;
        lpTotalShares[_marketId]            += shares;
        lpUserShares[_marketId][msg.sender] += shares;

        emit LiquidityAdded(_marketId, msg.sender, _amount, shares);
    }

    function removeLiquidity(uint256 _marketId, uint256 _shares) external {
        if (_shares == 0 || _shares > lpUserShares[_marketId][msg.sender])
            revert InvalidAmount();

        uint256 totalValue = lpPool[_marketId] + lpFees[_marketId];
        uint256 payout     = (_shares * totalValue) / lpTotalShares[_marketId];

        lpUserShares[_marketId][msg.sender] -= _shares;
        lpTotalShares[_marketId]            -= _shares;

        if (payout <= lpPool[_marketId]) {
            lpPool[_marketId] -= payout;
        } else {
            uint256 fromFees = payout - lpPool[_marketId];
            lpPool[_marketId] = 0;
            lpFees[_marketId] -= fromFees;
        }

        address token = registry.getToken(_marketId);
        bool ok = IERC20(token).transfer(msg.sender, payout);
        if (!ok) revert TransferFailed();

        emit LiquidityRemoved(_marketId, msg.sender, payout, _shares);
    }

    function creditFees(uint256 _marketId, uint256 _amount) external {
        lpFees[_marketId] += _amount;
    }

    function getLPPosition(uint256 _marketId, address _user)
        external view returns (uint256 shares, uint256 totalShares, uint256 poolSize)
    {
        return (lpUserShares[_marketId][_user], lpTotalShares[_marketId], lpPool[_marketId]);
    }
}
