// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRegistry {
    enum Outcome { UNRESOLVED, YES, NO }
    enum MarketStatus { OPEN, CLOSED, SETTLED }
    function isOpen(uint256 _marketId) external view returns (bool);
    function getToken(uint256 _marketId) external view returns (address);
    function getEndTime(uint256 _marketId) external view returns (uint256);
    function getStatus(uint256 _marketId) external view returns (MarketStatus);
    function recordBet(uint256 _marketId, Outcome _side, uint256 _netAmount) external;
    function closeMarket(uint256 _marketId) external;
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract BettingPool {

    IRegistry public registry;
    address   public owner;

    uint256 public constant FEE_BPS = 150;
    uint256 private constant BPS    = 10_000;

    mapping(uint256 => mapping(address => uint256)) public yesShares;
    mapping(uint256 => mapping(address => uint256)) public noShares;
    mapping(uint256 => uint256)                     public lpFees;
    mapping(address => uint256)                     public protocolFees;

    event BetPlaced(uint256 indexed marketId, address indexed user, uint8 side, uint256 amount, uint256 shares);
    event MarketAutoClosed(uint256 indexed marketId);

    error Unauthorized();
    error MarketNotOpen();
    error InvalidOutcome();
    error InvalidAmount();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _registry) {
        owner    = msg.sender;
        registry = IRegistry(_registry);
    }

    function placeBet(uint256 _marketId, uint8 _side, uint256 _amount) external {
        // _side: 1 = YES, 2 = NO
        if (_side != 1 && _side != 2) revert InvalidOutcome();
        if (_amount == 0) revert InvalidAmount();

        if (!registry.isOpen(_marketId)) {
            uint256 endTime = registry.getEndTime(_marketId);
            IRegistry.MarketStatus status = registry.getStatus(_marketId);
            if (block.timestamp >= endTime && status == IRegistry.MarketStatus.OPEN) {
                registry.closeMarket(_marketId);
                emit MarketAutoClosed(_marketId);
            }
            revert MarketNotOpen();
        }

        address token = registry.getToken(_marketId);
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), _amount);
        if (!ok) revert TransferFailed();

        uint256 fee         = (_amount * FEE_BPS) / BPS;
        uint256 netAmount   = _amount - fee;
        uint256 protocolFee = fee / 2;
        uint256 lpFee       = fee - protocolFee;

        protocolFees[token]       += protocolFee;
        lpFees[_marketId]         += lpFee;

        if (_side == 1) {
            yesShares[_marketId][msg.sender] += netAmount;
            registry.recordBet(_marketId, IRegistry.Outcome.YES, netAmount);
        } else {
            noShares[_marketId][msg.sender] += netAmount;
            registry.recordBet(_marketId, IRegistry.Outcome.NO, netAmount);
        }

        emit BetPlaced(_marketId, msg.sender, _side, _amount, netAmount);
    }

    function withdrawFees(address _token, address _to) external onlyOwner {
        uint256 amount = protocolFees[_token];
        protocolFees[_token] = 0;
        bool ok = IERC20(_token).transfer(_to, amount);
        if (!ok) revert TransferFailed();
    }

    function getPosition(uint256 _marketId, address _user)
        external view returns (uint256 yes, uint256 no)
    {
        return (yesShares[_marketId][_user], noShares[_marketId][_user]);
    }
}
