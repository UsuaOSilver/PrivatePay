// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LibWallet
/// @notice Library for making calls from wallet contracts
library LibWallet {
    /// @notice Make a call from the wallet contract
    /// @param wallet The wallet address making the call
    /// @param to The target address
    /// @param value The ETH value to send
    /// @param data The calldata
    function makeCall(
        address wallet,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        bytes memory callData = abi.encodePacked(abi.encode(to, value), data);

        assembly {
            if iszero(
                call(
                    gas(),
                    wallet,
                    0,
                    add(callData, 0x20),
                    mload(callData),
                    0,
                    0
                )
            ) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }
}

/// @title Wallet
/// @notice Ephemeral wallet for receiving payments before sweeping to real wallet
contract Wallet {
    error NotDeployer();

    /// @notice The deployer contract that created this wallet
    address public immutable deployer;

    constructor() payable {
        deployer = msg.sender;
    }

    /// @notice Receive function to accept ETH transfers
    receive() external payable {}

    /// @notice Fallback function to handle arbitrary calls
    /// @dev Only callable by deployer contract
    /// @dev Calldata format: abi.encodePacked(abi.encode(to, value), data)
    fallback() external payable {
        // Check caller is deployer (use Solidity instead of assembly for immutable)
        if (msg.sender != deployer) {
            revert NotDeployer();
        }

        assembly {
            // Extract target and value from calldata
            let to := calldataload(0)
            let value := calldataload(0x20)
            let inSize := sub(calldatasize(), 0x40)

            // Copy data portion
            calldatacopy(0, 0x40, inSize)

            // Make the call
            if iszero(call(gas(), to, value, 0, inSize, 0, 0)) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }
}
