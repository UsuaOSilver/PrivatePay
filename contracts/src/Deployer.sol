// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {LibWallet, Wallet} from "./Wallet.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {RelayAuthentication, IDeployer} from "./interface/IDeployer.sol";

/// @title Deployer
/// @notice CREATE2 deployer for ephemeral payment wallets
contract Deployer is IDeployer {
    /// @notice Mapping of used authentications (replay protection)
    mapping(bytes32 => bool) public spentAuth;

    /// @notice EIP-712 typehash for RelayAuthentication
    bytes32 public constant RELAY_AUTH_TYPEHASH =
        keccak256("RelayAuthentication(address owner,bytes32 salt,address to,uint256 value,bytes data)");

    /// @notice EIP-712 domain typehash
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice EIP-712 domain separator
    bytes32 public immutable DOMAIN_SEPARATOR;

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256("RelayAuthentication"),
                block.chainid,
                address(this)
            )
        );
    }

    /// @inheritdoc IDeployer
    function deploy(bytes32 salt, address to, uint256 value, bytes memory data)
        public
        returns (address)
    {
        bytes32 actualSalt = computeSalt(salt, msg.sender);

        // Deploy wallet using CREATE2
        address wallet = address(new Wallet{salt: actualSalt}());

        // Make the call
        LibWallet.makeCall(wallet, to, value, data);

        emit Deployed(msg.sender, salt, wallet);
        return wallet;
    }

    /// @inheritdoc IDeployer
    function relayDeploy(RelayAuthentication calldata auth, bytes memory signature)
        public
        returns (address)
    {
        // Compute digest
        bytes32 digest = eip712Digest(auth);

        // Check not already used
        if (spentAuth[digest]) {
            revert AuthenticationAlreadyUsed();
        }

        // Verify signature
        address signer = ECDSA.recover(digest, signature);
        if (signer != auth.owner) {
            revert InvalidSigner(signer, auth.owner);
        }

        // Mark as used
        spentAuth[digest] = true;

        // Deploy wallet
        bytes32 actualSalt = computeSalt(auth.salt, auth.owner);
        address wallet = address(new Wallet{salt: actualSalt}());

        // Make the call
        LibWallet.makeCall(wallet, auth.to, auth.value, auth.data);

        emit Deployed(auth.owner, auth.salt, wallet);
        return wallet;
    }

    /// @notice Deploy a wallet and sweep ERC20 tokens
    /// @param salt The salt for deterministic address
    /// @param token The ERC20 token address
    /// @param recipient The recipient of swept tokens
    function deployAndSweepERC20(bytes32 salt, address token, address recipient)
        public
        returns (address)
    {
        bytes32 actualSalt = computeSalt(salt, msg.sender);

        // Deploy wallet
        address wallet = address(new Wallet{salt: actualSalt}());

        // Get token balance
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("balanceOf(address)", wallet)
        );
        require(success, "balanceOf failed");
        uint256 balance = abi.decode(data, (uint256));

        // Encode transfer call
        bytes memory transferCall = abi.encodeWithSignature(
            "transfer(address,uint256)",
            recipient,
            balance
        );

        // Make the call to sweep tokens
        LibWallet.makeCall(wallet, token, 0, transferCall);

        emit Deployed(msg.sender, salt, wallet);
        return wallet;
    }

    /// @notice Owner can make additional calls to deployed wallet
    function ownerCall(bytes32 salt, address to, uint256 value, bytes memory data)
        public
    {
        address wallet = computeWalletAddress(salt, msg.sender);

        if (wallet.code.length == 0) {
            revert WalletNotDeployed();
        }

        LibWallet.makeCall(wallet, to, value, data);
    }

    /// @notice Hash a RelayAuthentication struct (EIP-712 structHash)
    function eip712StructHash(RelayAuthentication calldata auth)
        public
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                RELAY_AUTH_TYPEHASH,
                auth.owner,
                auth.salt,
                auth.to,
                auth.value,
                keccak256(auth.data)
            )
        );
    }

    /// @notice Full EIP-712 digest
    function eip712Digest(RelayAuthentication calldata auth)
        public
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, eip712StructHash(auth))
        );
    }

    /// @inheritdoc IDeployer
    function computeSalt(bytes32 salt, address owner)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(salt, owner));
    }

    /// @inheritdoc IDeployer
    function computeWalletAddress(bytes32 salt, address owner)
        public
        view
        returns (address)
    {
        bytes32 actualSalt = computeSalt(salt, owner);

        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            actualSalt,
                            keccak256(type(Wallet).creationCode)
                        )
                    )
                )
            )
        );
    }
}
