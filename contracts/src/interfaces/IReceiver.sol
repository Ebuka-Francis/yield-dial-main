// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IReceiver
/// @notice Interface for Chainlink CRE consumer contracts.
/// @dev The Chainlink Forwarder calls onReport() to deliver signed workflow data.
///      See https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-write/overview-ts
interface IReceiver {
    /// @notice Called by the Chainlink Forwarder to deliver a CRE workflow report.
    /// @param metadata Workflow metadata (workflow ID, owner, name — encoded by the DON).
    /// @param report   ABI-encoded payload produced by runtime.report() in the workflow.
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
