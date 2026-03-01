// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IWorldID} from "./interfaces/IWorldID.sol";
import {IReceiver} from "./interfaces/IReceiver.sol";

/// @title DestakerMarket
/// @notice Sybil-resistant yield prediction markets settled by Chainlink CRE workflows.
/// @dev Users buy YES/NO outcome shares with USDC. Markets are settled either by:
///      (a) an authorised CRE settler address calling settleMarket() directly, or
///      (b) the Chainlink Forwarder delivering a DON-signed report via onReport().
///      Winners redeem shares pro-rata for USDC. World ID verification prevents Sybil abuse.
contract DestakerMarket is IReceiver {
    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    enum Outcome {
        UNRESOLVED, // 0
        YES,        // 1
        NO          // 2
    }

    struct Market {
        string asset;           // e.g. "stETH"
        uint256 thresholdBps;   // basis points — 350 = 3.50%
        uint256 settlementDate; // unix timestamp
        bool settled;
        Outcome outcome;
        uint256 finalApyBps;    // final APY in bps written by CRE
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalCollateral; // total USDC deposited
        uint256 createdAt;
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

    /// @notice USDC token used as collateral (set once in constructor).
    IERC20 public immutable usdc;

    /// @notice World ID on-chain verifier contract.
    IWorldID public immutable worldId;

    /// @notice World ID app id hash — `abi.encodePacked("app_...", "/", "destaker-verify")`.
    uint256 public immutable externalNullifierHash;

    /// @notice World ID group id (1 = Orb, 0 = Device).
    uint256 public immutable groupId;

    /// @notice Contract owner (can create markets & set settler).
    address public owner;

    /// @notice Address authorised to settle markets (the CRE workflow DON address).
    address public settler;

    /// @notice Chainlink Forwarder contract that delivers DON-signed reports.
    address public forwarder;

    /// @notice Accumulated protocol fees (in USDC).
    uint256 public accumulatedFees;

    /// @notice Market id counter.
    uint256 public nextMarketId;

    /// @notice market id → Market data.
    mapping(uint256 => Market) public markets;

    /// @notice market id → user → YES shares.
    mapping(uint256 => mapping(address => uint256)) public yesShares;

    /// @notice market id → user → NO shares.
    mapping(uint256 => mapping(address => uint256)) public noShares;

    /// @notice market id → user → whether they already claimed.
    mapping(uint256 => mapping(address => bool)) public claimed;

    /// @notice nullifier hash → bool — prevents double-verification.
    mapping(uint256 => bool) public nullifierHashes;

    /// @notice address → bool — whether the address passed World ID verification.
    mapping(address => bool) public verifiedHumans;

    // ──────────────────────────────────────────────
    //  LP state (simplified constant-product)
    // ──────────────────────────────────────────────

    /// @notice market id → total LP USDC deposited.
    mapping(uint256 => uint256) public lpPool;

    /// @notice market id → user → LP deposit amount.
    mapping(uint256 => mapping(address => uint256)) public lpDeposits;

    /// @notice market id → total LP shares.
    mapping(uint256 => uint256) public lpTotalShares;

    /// @notice market id → user → LP shares.
    mapping(uint256 => mapping(address => uint256)) public lpUserShares;

    /// @notice market id → accumulated fees for LPs.
    mapping(uint256 => uint256) public lpFees;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event MarketCreated(uint256 indexed marketId, string asset, uint256 thresholdBps, uint256 settlementDate);
    event SharesPurchased(uint256 indexed marketId, address indexed buyer, Outcome side, uint256 usdcAmount, uint256 shares);
    event MarketSettled(uint256 indexed marketId, Outcome outcome, uint256 finalApyBps);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 payout);
    event HumanVerified(address indexed user, uint256 nullifierHash);
    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 lpShares);
    event LiquidityRemoved(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 lpShares);
    event SettlerUpdated(address indexed oldSettler, address indexed newSettler);
    event ForwarderUpdated(address indexed oldForwarder, address indexed newForwarder);
    event SettlementReportReceived(uint256 indexed marketId, Outcome outcome, uint256 finalApyBps);

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error Unauthorized();
    error MarketNotFound();
    error MarketAlreadySettled();
    error MarketNotSettled();
    error InvalidOutcome();
    error InvalidAmount();
    error NotVerifiedHuman();
    error AlreadyClaimed();
    error NothingToClaim();
    error InvalidNullifier();
    error TransferFailed();
    error InvalidForwarder();
    error InvalidReportLength();

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

    modifier onlyVerified() {
        if (!verifiedHumans[msg.sender]) revert NotVerifiedHuman();
        _;
    }

    modifier marketExists(uint256 _marketId) {
        if (_marketId >= nextMarketId) revert MarketNotFound();
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /// @param _usdc USDC token address.
    /// @param _worldId World ID Router contract address.
    /// @param _appId The World ID app id string, e.g. "app_135f61bfd908558b3c07fd6580d58192".
    /// @param _actionId The action identifier string, e.g. "destaker-verify".
    /// @param _groupId 1 for Orb, 0 for Device.
    /// @param _settler Initial CRE settler address.
    constructor(
        address _usdc,
        address _worldId,
        string memory _appId,
        string memory _actionId,
        uint256 _groupId,
        address _settler
    ) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
        worldId = IWorldID(_worldId);
        groupId = _groupId;
        settler = _settler;

        // Compute external nullifier hash the same way the World ID SDK does:
        //   hash(hash(appId) + actionId)
        externalNullifierHash = uint256(
            keccak256(abi.encodePacked(uint256(keccak256(abi.encodePacked(_appId))), _actionId))
        );
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    /// @notice Transfer ownership.
    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    /// @notice Update the CRE settler address.
    function setSettler(address _settler) external onlyOwner {
        emit SettlerUpdated(settler, _settler);
        settler = _settler;
    }

    /// @notice Update the Chainlink Forwarder address.
    function setForwarder(address _forwarder) external onlyOwner {
        emit ForwarderUpdated(forwarder, _forwarder);
        forwarder = _forwarder;
    }

    /// @notice Withdraw accumulated protocol fees.
    function withdrawFees(address _to) external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        _transferUSDC(_to, amount);
    }

    // ──────────────────────────────────────────────
    //  World ID verification
    // ──────────────────────────────────────────────

    /// @notice Verify a user's World ID proof on-chain. After verification the user is
    ///         marked as a verified human and can trade on all markets.
    /// @param root The Merkle tree root from IDKit.
    /// @param nullifierHash The nullifier hash from IDKit.
    /// @param proof The ZK proof (8 elements) from IDKit.
    function verifyAndRegister(
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        // Prevent double-verification with the same nullifier.
        if (nullifierHashes[nullifierHash]) revert InvalidNullifier();

        // Signal is the caller's address — ties the proof to this specific wallet.
        uint256 signalHash = uint256(keccak256(abi.encodePacked(msg.sender)));

        // Will revert if the proof is invalid.
        worldId.verifyProof(root, groupId, signalHash, nullifierHash, externalNullifierHash, proof);

        nullifierHashes[nullifierHash] = true;
        verifiedHumans[msg.sender] = true;

        emit HumanVerified(msg.sender, nullifierHash);
    }

    // ──────────────────────────────────────────────
    //  Market creation
    // ──────────────────────────────────────────────

    /// @notice Create a new yield prediction market.
    /// @param _asset Display name, e.g. "stETH".
    /// @param _thresholdBps APY threshold in basis points (350 = 3.50%).
    /// @param _settlementDate Unix timestamp when the market can be settled.
    /// @return marketId The newly created market's id.
    function createMarket(
        string calldata _asset,
        uint256 _thresholdBps,
        uint256 _settlementDate
    ) external onlyOwner returns (uint256 marketId) {
        marketId = nextMarketId++;
        markets[marketId] = Market({
            asset: _asset,
            thresholdBps: _thresholdBps,
            settlementDate: _settlementDate,
            settled: false,
            outcome: Outcome.UNRESOLVED,
            finalApyBps: 0,
            totalYesShares: 0,
            totalNoShares: 0,
            totalCollateral: 0,
            createdAt: block.timestamp
        });
        emit MarketCreated(marketId, _asset, _thresholdBps, _settlementDate);
    }

    // ──────────────────────────────────────────────
    //  Trading
    // ──────────────────────────────────────────────

    /// @notice Buy YES or NO shares with USDC. Shares are minted 1:1 minus the fee.
    ///         e.g. deposit 100 USDC → 1.5 USDC fee → 98.5 shares minted.
    /// @param _marketId The market to trade on.
    /// @param _side Outcome.YES (1) or Outcome.NO (2).
    /// @param _usdcAmount Amount of USDC to spend.
    function buyShares(
        uint256 _marketId,
        Outcome _side,
        uint256 _usdcAmount
    ) external onlyVerified marketExists(_marketId) {
        Market storage m = markets[_marketId];
        if (m.settled) revert MarketAlreadySettled();
        if (_side != Outcome.YES && _side != Outcome.NO) revert InvalidOutcome();
        if (_usdcAmount == 0) revert InvalidAmount();

        // Pull USDC from user.
        _pullUSDC(msg.sender, _usdcAmount);

        // Deduct fee.
        uint256 fee = (_usdcAmount * FEE_BPS) / BPS;
        uint256 netAmount = _usdcAmount - fee;

        // Split fees: 50% protocol, 50% LP pool.
        uint256 protocolFee = fee / 2;
        uint256 lpFee = fee - protocolFee;
        accumulatedFees += protocolFee;
        lpFees[_marketId] += lpFee;

        // Mint shares 1:1 with net USDC.
        if (_side == Outcome.YES) {
            yesShares[_marketId][msg.sender] += netAmount;
            m.totalYesShares += netAmount;
        } else {
            noShares[_marketId][msg.sender] += netAmount;
            m.totalNoShares += netAmount;
        }

        m.totalCollateral += netAmount;

        emit SharesPurchased(_marketId, msg.sender, _side, _usdcAmount, netAmount);
    }

    // ──────────────────────────────────────────────
    //  CRE Settlement — IReceiver (production path)
    // ──────────────────────────────────────────────

    /// @notice Called by the Chainlink Forwarder to deliver a DON-signed settlement report.
    ///         The report is ABI-encoded as a batch of (uint256 marketId, uint8 outcome, uint256 finalApyBps)
    ///         tuples produced by runtime.report() in the CRE TypeScript workflow.
    /// @param metadata Workflow metadata (ignored for now — can be used for workflow ID validation).
    /// @param report   ABI-encoded settlement payload.
    function onReport(bytes calldata metadata, bytes calldata report) external override {
        if (msg.sender != forwarder) revert InvalidForwarder();
        // Silence unused-parameter warning; metadata can be validated in a future version.
        metadata;

        // Decode a batch of settlements: (uint256 marketId, uint8 outcome, uint256 finalApyBps)[]
        // Each tuple is 3 × 32 = 96 bytes.
        if (report.length == 0 || report.length % 96 != 0) revert InvalidReportLength();

        uint256 count = report.length / 96;
        for (uint256 i = 0; i < count; i++) {
            (uint256 marketId, uint8 rawOutcome, uint256 finalApyBps) =
                abi.decode(report[i * 96:(i + 1) * 96], (uint256, uint8, uint256));

            Outcome outcome = Outcome(rawOutcome);
            emit SettlementReportReceived(marketId, outcome, finalApyBps);

            // Silently skip invalid entries rather than reverting the entire batch.
            if (marketId >= nextMarketId) continue;
            if (markets[marketId].settled) continue;
            if (outcome != Outcome.YES && outcome != Outcome.NO) continue;

            _settle(marketId, outcome, finalApyBps);
        }
    }

    // ──────────────────────────────────────────────
    //  Settlement — legacy direct call
    // ──────────────────────────────────────────────

    /// @notice Settle a market directly. Only callable by the authorised CRE settler address.
    ///         Kept for backward compatibility and simpler testing.
    /// @param _marketId The market to settle.
    /// @param _outcome 1 for YES, 2 for NO.
    /// @param _finalApyBps The final APY observed, in basis points.
    function settleMarket(
        uint256 _marketId,
        Outcome _outcome,
        uint256 _finalApyBps
    ) external onlySettler marketExists(_marketId) {
        if (markets[_marketId].settled) revert MarketAlreadySettled();
        if (_outcome != Outcome.YES && _outcome != Outcome.NO) revert InvalidOutcome();

        _settle(_marketId, _outcome, _finalApyBps);
    }

    // ──────────────────────────────────────────────
    //  Claims
    // ──────────────────────────────────────────────

    /// @notice Claim winnings after a market has settled. Winning shares are redeemed
    ///         pro-rata from the total collateral pool (winners split the losers' collateral).
    /// @param _marketId The settled market.
    function claim(uint256 _marketId) external marketExists(_marketId) {
        Market storage m = markets[_marketId];
        if (!m.settled) revert MarketNotSettled();
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

        // Payout = user's share of total collateral.
        // If nobody won (winningPool == 0 should not happen after settlement with valid outcome),
        // but guard anyway.
        uint256 payout;
        if (winningPool > 0) {
            payout = (m.totalCollateral * userShares) / winningPool;
        }

        if (payout > 0) {
            _transferUSDC(msg.sender, payout);
        }

        emit Claimed(_marketId, msg.sender, payout);
    }

    // ──────────────────────────────────────────────
    //  Liquidity provision (simplified)
    // ──────────────────────────────────────────────

    /// @notice Add USDC liquidity to a market. LPs earn a share of trading fees.
    /// @param _marketId The market to provide liquidity for.
    /// @param _amount USDC amount to deposit.
    function addLiquidity(uint256 _marketId, uint256 _amount) external onlyVerified marketExists(_marketId) {
        if (_amount == 0) revert InvalidAmount();
        if (markets[_marketId].settled) revert MarketAlreadySettled();

        _pullUSDC(msg.sender, _amount);

        uint256 shares;
        if (lpTotalShares[_marketId] == 0) {
            shares = _amount;
        } else {
            shares = (_amount * lpTotalShares[_marketId]) / lpPool[_marketId];
        }

        lpPool[_marketId] += _amount;
        lpTotalShares[_marketId] += shares;
        lpUserShares[_marketId][msg.sender] += shares;
        lpDeposits[_marketId][msg.sender] += _amount;

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

        // Deduct from pool + fees proportionally.
        if (payout <= lpPool[_marketId]) {
            lpPool[_marketId] -= payout;
        } else {
            uint256 fromFees = payout - lpPool[_marketId];
            lpPool[_marketId] = 0;
            lpFees[_marketId] -= fromFees;
        }

        _transferUSDC(msg.sender, payout);

        emit LiquidityRemoved(_marketId, msg.sender, payout, _shares);
    }

    // ──────────────────────────────────────────────
    //  View helpers
    // ──────────────────────────────────────────────

    /// @notice Get full market data.
    function getMarket(uint256 _marketId) external view marketExists(_marketId) returns (Market memory) {
        return markets[_marketId];
    }

    /// @notice Get a user's positions in a market.
    function getPosition(uint256 _marketId, address _user)
        external
        view
        returns (uint256 yes, uint256 no, bool hasClaimed)
    {
        return (yesShares[_marketId][_user], noShares[_marketId][_user], claimed[_marketId][_user]);
    }

    /// @notice Check if an address is a verified human.
    function isVerifiedHuman(address _user) external view returns (bool) {
        return verifiedHumans[_user];
    }

    // ──────────────────────────────────────────────
    //  Internal helpers
    // ──────────────────────────────────────────────

    /// @dev Core settlement logic shared by onReport() and settleMarket().
    function _settle(uint256 _marketId, Outcome _outcome, uint256 _finalApyBps) internal {
        Market storage m = markets[_marketId];
        m.settled = true;
        m.outcome = _outcome;
        m.finalApyBps = _finalApyBps;
        emit MarketSettled(_marketId, _outcome, _finalApyBps);
    }

    function _pullUSDC(address _from, uint256 _amount) internal {
        bool ok = usdc.transferFrom(_from, address(this), _amount);
        if (!ok) revert TransferFailed();
    }

    function _transferUSDC(address _to, uint256 _amount) internal {
        bool ok = usdc.transfer(_to, _amount);
        if (!ok) revert TransferFailed();
    }
}

/// @notice Minimal ERC-20 interface (USDC).
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
