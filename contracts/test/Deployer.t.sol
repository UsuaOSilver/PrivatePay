// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Deployer.sol";
import "../src/Wallet.sol";

contract DeployerTest is Test {
    Deployer public deployer;
    address public owner;

    function setUp() public {
        deployer = new Deployer();
        owner = address(0x1);
    }

    function testComputeAddress() public {
        bytes32 salt = bytes32(uint256(1));
        address predicted = deployer.computeWalletAddress(salt, owner);

        vm.prank(owner);
        address actual = deployer.deploy(salt, address(0), 0, "");

        assertEq(predicted, actual);
    }

    function testDeployAndSweepETH() public {
        bytes32 salt = bytes32(uint256(1));

        // Compute burner address
        address burner = deployer.computeWalletAddress(salt, owner);

        // Send ETH to burner
        vm.deal(burner, 1 ether);

        // Deploy and sweep to recipient
        address recipient = address(0x2);
        vm.prank(owner);
        deployer.deploy(salt, recipient, 1 ether, "");

        // Verify recipient received ETH
        assertEq(recipient.balance, 1 ether);
    }

    function testSaltIncludesOwner() public view{
        bytes32 salt = bytes32(uint256(1));

        // Different owners should get different addresses
        address addr1 = deployer.computeWalletAddress(salt, address(0x1));
        address addr2 = deployer.computeWalletAddress(salt, address(0x2));

        assertTrue(addr1 != addr2);
    }
}
