// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IWorldID
/// @notice Interface for the World ID on-chain verifier contract.
/// @dev See https://docs.world.org/world-id/reference/contracts
interface IWorldID {
    /// @notice Verifies a World ID zero-knowledge proof.
    /// @param root The Merkle root of the identity group (obtained from the IDKit widget).
    /// @param groupId The group ID (1 for Orb-verified, 0 for Device-verified).
    /// @param signalHash The keccak256 hash of the signal (e.g. user's wallet address).
    /// @param nullifierHash The nullifier hash to prevent double-signaling.
    /// @param externalNullifierHash The external nullifier hash (derived from app_id + action).
    /// @param proof The zero-knowledge proof (8 uint256 elements packed from the proof string).
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}
