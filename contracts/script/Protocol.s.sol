// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Deployer.sol";
import "../src/Wallet.sol";

contract ProtocolScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Deployer contract
        Deployer deployer = new Deployer();

        console.log("Deployer deployed at:", address(deployer));
        console.log("Wallet initCodeHash:", vm.toString(keccak256(type(Wallet).creationCode)));

        vm.stopBroadcast();
    }
}
