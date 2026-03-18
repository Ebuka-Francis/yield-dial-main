// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MarketRegistry {

    enum MarketStatus { OPEN, CLOSED, SETTLED }
    enum Outcome      { UNRESOLVED, YES, NO }

    struct Market {
        uint256      marketId;
        bytes32      asset;
        uint256      thresholdBps;
        uint256      startTime;
        uint256      endTime;
        uint256      settlementTime;
        address      token;
        uint256      totalYesShares;
        uint256      totalNoShares;
        uint256      totalCollateral;
        MarketStatus status;
        Outcome      outcome;
        uint256      finalApyBps;
        uint256      createdAt;
        uint256      settledAt;
    }

    address public owner;
    uint256 public nextMarketId;

    mapping(uint256 => Market) private markets;
    mapping(address => bool)   public authorised;

    event MarketCreated(uint256 indexed marketId, bytes32 asset, uint256 thresholdBps, uint256 startTime, uint256 endTime, uint256 settlementTime, address token);
    event MarketClosed(uint256 indexed marketId);
    event MarketSettled(uint256 indexed marketId, Outcome outcome, uint256 finalApyBps, uint256 settledAt);

    error Unauthorized();
    error InvalidTimestamp();
    error InvalidToken();
    error MarketNotFound();
    error MarketNotOpen();
    error MarketAlreadySettled();
    error TooEarlyToSettle();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAuthorised() {
        if (!authorised[msg.sender] && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier marketExists(uint256 _marketId) {
        if (_marketId >= nextMarketId) revert MarketNotFound();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setAuthorised(address _contract, bool _status) external onlyOwner {
        authorised[_contract] = _status;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function createMarket(
        bytes32 _asset,
        uint256 _thresholdBps,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _settlementTime,
        address _token
    ) external onlyOwner returns (uint256 marketId) {
        if (_startTime >= _endTime)     revert InvalidTimestamp();
        if (_settlementTime < _endTime) revert InvalidTimestamp();
        if (_token == address(0))       revert InvalidToken();

        marketId = nextMarketId++;
        Market storage m = markets[marketId];
        m.marketId       = marketId;
        m.asset          = _asset;
        m.thresholdBps   = _thresholdBps;
        m.startTime      = _startTime;
        m.endTime        = _endTime;
        m.settlementTime = _settlementTime;
        m.token          = _token;
        m.status         = MarketStatus.OPEN;
        m.outcome        = Outcome.UNRESOLVED;
        m.createdAt      = block.timestamp;

        emit MarketCreated(marketId, _asset, _thresholdBps, _startTime, _endTime, _settlementTime, _token);
    }

    function recordBet(uint256 _marketId, Outcome _side, uint256 _netAmount)
        external onlyAuthorised marketExists(_marketId)
    {
        Market storage m = markets[_marketId];
        if (m.status != MarketStatus.OPEN) revert MarketNotOpen();
        if (_side == Outcome.YES) {
            m.totalYesShares += _netAmount;
        } else {
            m.totalNoShares += _netAmount;
        }
        m.totalCollateral += _netAmount;
    }

    function closeMarket(uint256 _marketId) external onlyAuthorised marketExists(_marketId) {
        if (markets[_marketId].status != MarketStatus.OPEN) revert MarketNotOpen();
        markets[_marketId].status = MarketStatus.CLOSED;
        emit MarketClosed(_marketId);
    }

    function recordSettlement(uint256 _marketId, Outcome _outcome, uint256 _finalApyBps)
        external onlyAuthorised marketExists(_marketId)
    {
        Market storage m = markets[_marketId];
        if (m.status == MarketStatus.SETTLED) revert MarketAlreadySettled();
        if (block.timestamp < m.settlementTime) revert TooEarlyToSettle();
        m.status      = MarketStatus.SETTLED;
        m.outcome     = _outcome;
        m.finalApyBps = _finalApyBps;
        m.settledAt   = block.timestamp;
        emit MarketSettled(_marketId, _outcome, _finalApyBps, block.timestamp);
    }

    // individual getters — avoid returning full struct across contract calls
    function getThreshold(uint256 _marketId) external view marketExists(_marketId) returns (uint256) {
        return markets[_marketId].thresholdBps;
    }

    function getToken(uint256 _marketId) external view marketExists(_marketId) returns (address) {
        return markets[_marketId].token;
    }

    function getOutcome(uint256 _marketId) external view marketExists(_marketId) returns (Outcome) {
        return markets[_marketId].outcome;
    }

    function getTotals(uint256 _marketId) external view marketExists(_marketId)
        returns (uint256 totalYes, uint256 totalNo, uint256 totalCollateral)
    {
        Market storage m = markets[_marketId];
        return (m.totalYesShares, m.totalNoShares, m.totalCollateral);
    }

    function getEndTime(uint256 _marketId) external view marketExists(_marketId) returns (uint256) {
        return markets[_marketId].endTime;
    }

    function getStatus(uint256 _marketId) external view marketExists(_marketId) returns (MarketStatus) {
        return markets[_marketId].status;
    }

    function isOpen(uint256 _marketId) external view marketExists(_marketId) returns (bool) {
        Market storage m = markets[_marketId];
        return m.status == MarketStatus.OPEN && block.timestamp < m.endTime;
    }

    function isSettled(uint256 _marketId) external view marketExists(_marketId) returns (bool) {
        return markets[_marketId].status == MarketStatus.SETTLED;
    }

    // full struct only for frontend/off-chain reads
    function getMarket(uint256 _marketId) external view marketExists(_marketId) returns (Market memory) {
        return markets[_marketId];
    }
}
