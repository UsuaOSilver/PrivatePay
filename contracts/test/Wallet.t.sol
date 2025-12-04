// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Wallet.sol";

contract WalletTest is Test {
    Wallet public wallet;
    address public deployer;

    function setUp() public {
        deployer = address(this);
        wallet = new Wallet();
    }

    function testDeployerIsSet() public {
        assertEq(wallet.deployer(), deployer);
    }

    function testCanReceiveETH() public {
        // Send ETH to wallet
        payable(address(wallet)).transfer(1 ether);
        assertEq(address(wallet).balance, 1 ether);
    }

    function testOnlyDeployerCanCall() public {
        // Prepare call data
        address target = address(0x123);
        bytes memory data = abi.encodePacked(
            abi.encode(target, uint256(0)),
            bytes("")
        );

        // Should succeed from deployer
        (bool success,) = address(wallet).call(data);
        assertTrue(success);

        // Should fail from non-deployer
        vm.prank(address(0x456));
        (success,) = address(wallet).call(data);
        assertFalse(success);
    }
}
