// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title DestakerMarket
/// @notice Decentralized yield prediction markets settled by a trusted oracle or admin.
/// @dev Users place bets on YES/NO outcomes with a stablecoin. Markets are created by
///      an authorized admin, settled by a trusted settler address that posts the final
///      APY and outcome. Winners claim rewards pro-rata from the total pool.
contract DestakerMarket {

    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    enum MarketStatus {
        OPEN,       // 0 — accepting bets
        CLOSED,     // 1 — no longer accepting bets, awaiting settlement
        SETTLED     // 2 — outcome determined, claims open
    }

    enum Outcome {
        UNRESOLVED, // 0
        YES,        // 1 — final APY stayed above threshold
        NO          // 2 — final APY fell below threshold
    }

    struct Market {
        uint256 marketId;
        string asset;            // e.g. "stETH"
        uint256 thresholdBps;    // APY threshold in basis points — 350 = 3.50%
        uint256 startTime;       // unix timestamp — when betting opens
        uint256 endTime;         // unix timestamp — when betting closes
        uint256 settlementTime;  // unix timestamp — when market can be settled
        address token;           // stablecoin used for trading (e.g. USDC)
        uint256 totalYesShares;  // total liquidity on YES side
        uint256 totalNoShares;   // total liquidity on NO side
        MarketStatus status;     // open / closed / settled
        Outcome outcome;         // final outcome after settlement
        uint256 finalApyBps;     // final APY in bps written by settler
        uint256 totalCollateral; // total tokens deposited
        uint256 createdAt;       // block timestamp at creation
        uint256 settledAt;       // block timestamp at settlement
    }

    struct Position {
        address user;
        uint256 marketId;
        Outcome side;
        uint256 amount;
        bool claimed;
    }

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    /// @notice Trading fee in basis points (150 = 1.5%).
    uint256 public constant FEE_BPS = 150;
    uint256 private constant BPS = 10_000;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice Contract owner — can create markets, set settler, withdraw fees.
    address public owner;

    /// @notice Address authorised to settle markets (oracle or trusted admin).
    address public settler;

    /// @notice Accumulated protocol fees per token.
    mapping(address => uint256) public accumulatedFees;

    /// @notice Market id counter.
    uint256 public nextMarketId;

    /// @notice market id → Market data.
    mapping(uint256 => Market) public markets;

    /// @notice market id → user → YES shares.
    mapping(uint256 => mapping(address => uint256)) public yesShares;

    /// @notice market id → user → NO shares.
    mapping(uint256 => mapping(address => uint256)) public noShares;

    /// @notice market id → user → whether they already claimed reward.
    mapping(uint256 => mapping(address => bool)) public claimed;

    // ──────────────────────────────────────────────
    //  LP state
    // ──────────────────────────────────────────────

    /// @notice market id → total LP tokens deposited.
    mapping(uint256 => uint256) public lpPool;

    /// @notice market id → total LP shares issued.
    mapping(uint256 => uint256) public lpTotalShares;

    /// @notice market id → user → LP shares held.
    mapping(uint256 => mapping(address => uint256)) public lpUserShares;

    /// @notice market id → accumulated LP fees.
    mapping(uint256 => uint256) public lpFees;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event MarketCreated(
        uint256 indexed marketId,
        string asset,
        uint256 thresholdBps,
        uint256 startTime,
        uint256 endTime,
        uint256 settlementTime,
        address token
    );
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        Outcome side,
        uint256 amount,
        uint256 shares
    );
    event MarketClosed(uint256 indexed marketId);
    event MarketSettled(
        uint256 indexed marketId,
        Outcome outcome,
        uint256 finalApyBps,
        uint256 settledAt
    );
    event RewardClaimed(uint256 indexed marketId, address indexed user, uint256 payout);
    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 lpShares);
    event LiquidityRemoved(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 lpShares);
    event SettlerUpdated(address indexed oldSettler, address indexed newSettler);
    event FeesWithdrawn(address indexed token, address indexed to, uint256 amount);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error Unauthorized();
    error MarketNotFound();
    error MarketNotOpen();
    error MarketNotClosed();
    error MarketNotSettled();
    error MarketAlreadySettled();
    error InvalidOutcome();
    error InvalidAmount();
    error InvalidTimestamp();
    error AlreadyClaimed();
    error NothingToClaim();
    error TransferFailed();

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlySettler() {
        if (msg.sender != settler) revert Unauthorized();
        _;
    }

    modifier marketExists(uint256 _marketId) {
        if (_marketId >= nextMarketId) revert MarketNotFound();
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /// @param _settler Initial settler address (oracle or trusted admin).
    constructor(address _settler) {
        owner = msg.sender;
        settler = _settler;
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    /// @notice Transfer ownership.
    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    /// @notice Update the settler address.
    function setSettler(address _settler) external onlyOwner {
        emit SettlerUpdated(settler, _settler);
        settler = _settler;
    }

    /// @notice Withdraw accumulated protocol fees for a given token.
    function withdrawFees(address _token, address _to) external onlyOwner {
        uint256 amount = accumulatedFees[_token];
        accumulatedFees[_token] = 0;
        _transferToken(_token, _to, amount);
        emit FeesWithdrawn(_token, _to, amount);
    }

    /// @notice Manually close a market (stop accepting bets).
    ///         Can also be triggered automatically in placeBet() once endTime passes.
    function closeMarket(uint256 _marketId) external onlyOwner marketExists(_marketId) {
        Market storage m = markets[_marketId];
        if (m.status != MarketStatus.OPEN) revert MarketNotOpen();
        m.status = MarketStatus.CLOSED;
        emit MarketClosed(_marketId);
    }

    // ──────────────────────────────────────────────
    //  Market Creation
    // ──────────────────────────────────────────────

    /// @notice Create a new yield prediction market.
    /// @param _asset Display name of tracked asset e.g. "stETH".
    /// @param _thresholdBps APY threshold in basis points (350 = 3.50%).
    /// @param _startTime Unix timestamp when betting opens.
    /// @param _endTime Unix timestamp when betting closes.
    /// @param _settlementTime Unix timestamp when market can be settled (must be >= endTime).
    /// @param _token Stablecoin token address used for trading.
    /// @return marketId The newly created market's id.
    function createMarket(
        string calldata _asset,
        uint256 _thresholdBps,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _settlementTime,
        address _token
    ) external onlyOwner returns (uint256 marketId) {
        if (_startTime >= _endTime) revert InvalidTimestamp();
        if (_settlementTime < _endTime) revert InvalidTimestamp();
        if (_token == address(0)) revert InvalidAmount();

        marketId = nextMarketId++;

        markets[marketId] = Market({
            marketId: marketId,
            asset: _asset,
            thresholdBps: _thresholdBps,
            startTime: _startTime,
            endTime: _endTime,
            settlementTime: _settlementTime,
            token: _token,
            totalYesShares: 0,
            totalNoShares: 0,
            status: MarketStatus.OPEN,
            outcome: Outcome.UNRESOLVED,
            finalApyBps: 0,
            totalCollateral: 0,
            createdAt: block.timestamp,
            settledAt: 0
        });

        emit MarketCreated(marketId, _asset, _thresholdBps, _startTime, _endTime, _settlementTime, _token);
    }

    // ──────────────────────────────────────────────
    //  Place Bet
    // ──────────────────────────────────────────────

    /// @notice Place a bet on YES or NO outcome.
    /// @param _marketId The market to bet on.
    /// @param _side Outcome.YES (1) or Outcome.NO (2).
    /// @param _amount Amount of tokens to deposit.
    function placeBet(
        uint256 _marketId,
        Outcome _side,
        uint256 _amount
    ) external marketExists(_marketId) {
        Market storage m = markets[_marketId];

        // Auto-close market if endTime has passed.
        if (block.timestamp >= m.endTime && m.status == MarketStatus.OPEN) {
            m.status = MarketStatus.CLOSED;
            emit MarketClosed(_marketId);
        }

        if (m.status != MarketStatus.OPEN) revert MarketNotOpen();
        if (_side != Outcome.YES && _side != Outcome.NO) revert InvalidOutcome();
        if (_amount == 0) revert InvalidAmount();

        // Pull tokens from user.
        _pullToken(m.token, msg.sender, _amount);

        // Deduct fee — split 50% protocol, 50% LP pool.
        uint256 fee = (_amount * FEE_BPS) / BPS;
        uint256 netAmount = _amount - fee;
        uint256 protocolFee = fee / 2;
        uint256 lpFee = fee - protocolFee;

        accumulatedFees[m.token] += protocolFee;
        lpFees[_marketId] += lpFee;

        // Record position — shares minted 1:1 with net amount.
        if (_side == Outcome.YES) {
            yesShares[_marketId][msg.sender] += netAmount;
            m.totalYesShares += netAmount;
        } else {
            noShares[_marketId][msg.sender] += netAmount;
            m.totalNoShares += netAmount;
        }

        m.totalCollateral += netAmount;

        emit BetPlaced(_marketId, msg.sender, _side, _amount, netAmount);
    }

    // ──────────────────────────────────────────────
    //  Liquidity Provision
    // ──────────────────────────────────────────────

    /// @notice Provide liquidity to a market. LPs earn a share of trading fees.
    /// @param _marketId The market to provide liquidity for.
    /// @param _amount Token amount to deposit.
    function provideLiquidity(uint256 _marketId, uint256 _amount) external marketExists(_marketId) {
        Market storage m = markets[_marketId];
        if (m.status != MarketStatus.OPEN) revert MarketNotOpen();
        if (_amount == 0) revert InvalidAmount();

        _pullToken(m.token, msg.sender, _amount);

        // Mint LP shares proportional to contribution.
        uint256 shares;
        if (lpTotalShares[_marketId] == 0) {
            shares = _amount;
        } else {
            shares = (_amount * lpTotalShares[_marketId]) / lpPool[_marketId];
        }

        lpPool[_marketId] += _amount;
        lpTotalShares[_marketId] += shares;
        lpUserShares[_marketId][msg.sender] += shares;

        emit LiquidityAdded(_marketId, msg.sender, _amount, shares);
    }

    /// @notice Remove liquidity and collect earned fees.
    /// @param _marketId The market to withdraw from.
    /// @param _shares LP shares to redeem.
    function removeLiquidity(uint256 _marketId, uint256 _shares) external marketExists(_marketId) {
        if (_shares == 0 || _shares > lpUserShares[_marketId][msg.sender]) revert InvalidAmount();

        uint256 totalValue = lpPool[_marketId] + lpFees[_marketId];
        uint256 payout = (_shares * totalValue) / lpTotalShares[_marketId];

        lpUserShares[_marketId][msg.sender] -= _shares;
        lpTotalShares[_marketId] -= _shares;

        if (payout <= lpPool[_marketId]) {
            lpPool[_marketId] -= payout;
        } else {
            uint256 fromFees = payout - lpPool[_marketId];
            lpPool[_marketId] = 0;
            lpFees[_marketId] -= fromFees;
        }

        _transferToken(markets[_marketId].token, msg.sender, payout);

        emit LiquidityRemoved(_marketId, msg.sender, payout, _shares);
    }

    // ──────────────────────────────────────────────
    //  Market Settlement
    // ──────────────────────────────────────────────

    /// @notice Settle a market with the final APY value.
    ///         Only callable by the authorised settler address.
    ///         The settler fetches the real APY off-chain and posts it here.
    /// @param _marketId The market to settle.
    /// @param _finalApyBps The observed final APY in basis points.
    function settleMarket(
        uint256 _marketId,
        uint256 _finalApyBps
    ) external onlySettler marketExists(_marketId) {
        Market storage m = markets[_marketId];

        if (m.status == MarketStatus.SETTLED) revert MarketAlreadySettled();
        if (block.timestamp < m.settlementTime) revert MarketNotClosed();

        // Determine outcome by comparing final APY to threshold.
        Outcome outcome = _finalApyBps >= m.thresholdBps ? Outcome.YES : Outcome.NO;

        m.status = MarketStatus.SETTLED;
        m.outcome = outcome;
        m.finalApyBps = _finalApyBps;
        m.settledAt = block.timestamp;

        emit MarketSettled(_marketId, outcome, _finalApyBps, block.timestamp);
    }

    // ──────────────────────────────────────────────
    //  Reward Distribution
    // ──────────────────────────────────────────────

    /// @notice Claim reward after market settlement.
    ///         Winners receive a pro-rata share of the total collateral pool.
    /// @param _marketId The settled market to claim from.
    function claimReward(uint256 _marketId) external marketExists(_marketId) {
        Market storage m = markets[_marketId];
        if (m.status != MarketStatus.SETTLED) revert MarketNotSettled();
        if (claimed[_marketId][msg.sender]) revert AlreadyClaimed();

        uint256 userShares;
        uint256 winningPool;

        if (m.outcome == Outcome.YES) {
            userShares = yesShares[_marketId][msg.sender];
            winningPool = m.totalYesShares;
        } else {
            userShares = noShares[_marketId][msg.sender];
            winningPool = m.totalNoShares;
        }

        if (userShares == 0) revert NothingToClaim();

        claimed[_marketId][msg.sender] = true;

        // Payout = user's proportional share of total collateral pool.
        uint256 payout = 0;
        if (winningPool > 0) {
            payout = (m.totalCollateral * userShares) / winningPool;
        }

        if (payout > 0) {
            _transferToken(m.token, msg.sender, payout);
        }

        emit RewardClaimed(_marketId, msg.sender, payout);
    }

    // ──────────────────────────────────────────────
    //  View Helpers
    // ──────────────────────────────────────────────

    /// @notice Get full market data.
    function getMarket(uint256 _marketId) external view marketExists(_marketId) returns (Market memory) {
        return markets[_marketId];
    }

    /// @notice Get a user's position in a market.
    function getPosition(uint256 _marketId, address _user)
        external
        view
        returns (uint256 yes, uint256 no, bool hasClaimed)
    {
        return (
            yesShares[_marketId][_user],
            noShares[_marketId][_user],
            claimed[_marketId][_user]
        );
    }

    /// @notice Get a user's LP share in a market.
    function getLPPosition(uint256 _marketId, address _user)
        external
        view
        returns (uint256 shares, uint256 totalShares, uint256 poolSize)
    {
        return (
            lpUserShares[_marketId][_user],
            lpTotalShares[_marketId],
            lpPool[_marketId]
        );
    }

    /// @notice Get current market status as a string (for UI convenience).
    function getMarketStatus(uint256 _marketId) external view marketExists(_marketId) returns (string memory) {
        MarketStatus status = markets[_marketId].status;
        if (status == MarketStatus.OPEN) return "OPEN";
        if (status == MarketStatus.CLOSED) return "CLOSED";
        return "SETTLED";
    }

    // ──────────────────────────────────────────────
    //  Internal Helpers
    // ──────────────────────────────────────────────

    function _pullToken(address _token, address _from, uint256 _amount) internal {
        bool ok = IERC20(_token).transferFrom(_from, address(this), _amount);
        if (!ok) revert TransferFailed();
    }

    function _transferToken(address _token, address _to, uint256 _amount) internal {
        bool ok = IERC20(_token).transfer(_to, _amount);
        if (!ok) revert TransferFailed();
    }
}

// ──────────────────────────────────────────────
//  Interfaces
// ──────────────────────────────────────────────

/// @notice Minimal ERC-20 interface.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}