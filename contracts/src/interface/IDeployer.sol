// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RelayAuthentication
/// @notice Struct for EIP-712 relay authentication
struct RelayAuthentication {
    address owner;
    bytes32 salt;
    address to;
    uint256 value;
    bytes data;
}

/// @title IDeployer
/// @notice Interface for CREATE2 deployer contract
interface IDeployer {
    /// @notice Emitted when a wallet is deployed
    event Deployed(address indexed owner, bytes32 indexed salt, address wallet);

    /// @notice Thrown when authentication signature is invalid
    error InvalidSigner(address signer, address expected);

    /// @notice Thrown when authentication has already been used
    error AuthenticationAlreadyUsed();

    /// @notice Thrown when wallet is not deployed
    error WalletNotDeployed();

    /// @notice Deploy a wallet
    function deploy(bytes32 salt, address to, uint256 value, bytes memory data)
        external
        returns (address);

    /// @notice Deploy a wallet with relay authentication
    function relayDeploy(RelayAuthentication calldata auth, bytes memory signature)
        external
        returns (address);

    /// @notice Compute wallet address
    function computeWalletAddress(bytes32 salt, address owner)
        external
        view
        returns (address);

    /// @notice Compute salt including owner
    function computeSalt(bytes32 salt, address owner)
        external
        pure
        returns (bytes32);
}
