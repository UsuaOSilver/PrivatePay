'use client';
import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownDisconnect, 
  WalletDropdownLink 
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-base-blue rounded-full flex items-center justify-center text-white font-bold">P</div>
        <span className="text-xl font-bold tracking-tight">PrivatePay</span>
      </div>

      <div className="flex items-center gap-4">
        <Wallet>
          <ConnectWallet className="bg-white text-black font-semibold hover:bg-gray-100 transition-all">
            <Avatar className="h-6 w-6" />
            <Name className="text-sm" />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
              Wallet Settings
            </WalletDropdownLink>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    </nav>
  );
}