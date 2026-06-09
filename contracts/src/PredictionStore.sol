// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PredictionStore
 * @notice Append-only ledger of AI-generated predictions for the Mantle ecosystem.
 *
 * Each entry stores asset, direction, confidence, horizon, narrative reference,
 * timestamp and (later) realized outcome. The contract is the hackathon
 * differentiator: it provides a transparent, verifiable performance history of
 * the off-chain narrative agent.
 *
 * Roles:
 *  - `owner`     can rotate the recorder + resolver and pause writes.
 *  - `recorder`  (typically the backend signer) can append predictions.
 *  - `resolver`  (typically the same backend, or an oracle adapter) can resolve them.
 *
 * Predictions are immutable once recorded; resolutions are write-once.
 */
contract PredictionStore {
    enum Direction {
        Bearish,
        Neutral,
        Bullish
    }
    enum Status {
        Open,
        Won,
        Lost,
        Voided
    }

    struct Prediction {
        uint256 id;
        string asset;
        Direction direction;
        uint16 confidenceBps; // 0..10000
        uint16 horizonDays;
        string narrativeId;
        address recorder;
        uint64 createdAt;
        Status status;
        int32 realizedBps; // signed bps move, populated on resolve
        uint64 resolvedAt;
    }

    // ---------- Storage ----------

    address public owner;
    address public recorder;
    address public resolver;
    bool public paused;

    uint256 public predictionCount;
    mapping(uint256 => Prediction) private _predictions;

    // ---------- Events ----------

    event PredictionRecorded(
        uint256 indexed id,
        string asset,
        uint8 direction,
        uint16 confidence
    );
    event PredictionResolved(uint256 indexed id, int32 realizedBps, uint8 status);
    event RecorderUpdated(address indexed previous, address indexed next);
    event ResolverUpdated(address indexed previous, address indexed next);
    event Paused(bool paused);
    event OwnershipTransferred(address indexed previous, address indexed next);

    // ---------- Errors ----------

    error NotOwner();
    error NotRecorder();
    error NotResolver();
    error PausedError();
    error AlreadyResolved();
    error UnknownPrediction();
    error InvalidConfidence();
    error InvalidHorizon();
    error InvalidAsset();
    error ZeroAddress();

    // ---------- Modifiers ----------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    modifier onlyRecorder() {
        if (msg.sender != recorder) revert NotRecorder();
        _;
    }
    modifier onlyResolver() {
        if (msg.sender != resolver) revert NotResolver();
        _;
    }
    modifier whenNotPaused() {
        if (paused) revert PausedError();
        _;
    }

    // ---------- Construction ----------

    constructor(address _recorder, address _resolver) {
        if (_recorder == address(0) || _resolver == address(0)) revert ZeroAddress();
        owner = msg.sender;
        recorder = _recorder;
        resolver = _resolver;
        emit OwnershipTransferred(address(0), msg.sender);
        emit RecorderUpdated(address(0), _recorder);
        emit ResolverUpdated(address(0), _resolver);
    }

    // ---------- Admin ----------

    function transferOwnership(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, next);
        owner = next;
    }

    function setRecorder(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        emit RecorderUpdated(recorder, next);
        recorder = next;
    }

    function setResolver(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        emit ResolverUpdated(resolver, next);
        resolver = next;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    // ---------- Core ----------

    /**
     * @notice Append a new prediction. Returns the assigned on-chain id.
     * @param asset         Asset symbol the prediction is about (e.g. "mETH").
     * @param direction     0=Bearish, 1=Neutral, 2=Bullish.
     * @param confidence    Confidence in bps (0..10000 → 0..100%).
     * @param horizonDays   Resolution horizon, must be 7, 30 or 90.
     * @param narrativeId   Off-chain narrative reference (e.g. "NR-184").
     */
    function recordPrediction(
        string calldata asset,
        uint8 direction,
        uint16 confidence,
        uint16 horizonDays,
        string calldata narrativeId
    ) external whenNotPaused onlyRecorder returns (uint256 id) {
        if (bytes(asset).length == 0) revert InvalidAsset();
        if (direction > uint8(Direction.Bullish)) revert InvalidConfidence();
        if (confidence > 10_000) revert InvalidConfidence();
        if (!(horizonDays == 7 || horizonDays == 30 || horizonDays == 90)) revert InvalidHorizon();

        unchecked {
            id = ++predictionCount;
        }
        _predictions[id] = Prediction({
            id: id,
            asset: asset,
            direction: Direction(direction),
            confidenceBps: confidence,
            horizonDays: horizonDays,
            narrativeId: narrativeId,
            recorder: msg.sender,
            createdAt: uint64(block.timestamp),
            status: Status.Open,
            realizedBps: 0,
            resolvedAt: 0
        });

        emit PredictionRecorded(id, asset, direction, confidence);
    }

    /**
     * @notice Resolve an open prediction with the realized move in bps.
     *         status is derived: Won if (realizedBps sign matches direction & abs > 0), else Lost.
     *         Neutral predictions resolve to Won if |realizedBps| <= 100 bps (1%).
     */
    function resolvePrediction(uint256 id, int32 realizedBps) external whenNotPaused onlyResolver {
        Prediction storage p = _predictions[id];
        if (p.createdAt == 0) revert UnknownPrediction();
        if (p.status != Status.Open) revert AlreadyResolved();

        Status next;
        if (p.direction == Direction.Bullish) {
            next = realizedBps > 0 ? Status.Won : Status.Lost;
        } else if (p.direction == Direction.Bearish) {
            next = realizedBps < 0 ? Status.Won : Status.Lost;
        } else {
            // Neutral: tight band counts as a win
            int32 abs_ = realizedBps >= 0 ? realizedBps : -realizedBps;
            next = abs_ <= 100 ? Status.Won : Status.Lost;
        }

        p.status = next;
        p.realizedBps = realizedBps;
        p.resolvedAt = uint64(block.timestamp);

        emit PredictionResolved(id, realizedBps, uint8(next));
    }

    /// @notice Owner-only escape hatch for malformed entries (e.g. wrong asset symbol).
    function voidPrediction(uint256 id) external onlyOwner {
        Prediction storage p = _predictions[id];
        if (p.createdAt == 0) revert UnknownPrediction();
        if (p.status != Status.Open) revert AlreadyResolved();
        p.status = Status.Voided;
        p.resolvedAt = uint64(block.timestamp);
        emit PredictionResolved(id, 0, uint8(Status.Voided));
    }

    // ---------- Reads ----------

    function getPrediction(uint256 id) external view returns (Prediction memory) {
        Prediction memory p = _predictions[id];
        if (p.createdAt == 0) revert UnknownPrediction();
        return p;
    }

    /// @notice Paginated read: returns predictions with id in [start, start+count).
    function getPredictions(uint256 start, uint256 count)
        external
        view
        returns (Prediction[] memory page)
    {
        uint256 total = predictionCount;
        if (start == 0 || start > total) return new Prediction[](0);
        uint256 end = start + count - 1;
        if (end > total) end = total;
        page = new Prediction[](end - start + 1);
        for (uint256 i = start; i <= end; ++i) {
            page[i - start] = _predictions[i];
        }
    }
}
