# Network Configuration Fix Guide

## Problem Identified
Your application was accepting connections on **any network**, including Base Mainnet. This meant users could accidentally spend real ETH instead of testnet ETH when interacting with your application.

## Changes Made

### 1. Network Switcher Component
**Created:** `frontend/src/components/network-switcher.tsx`

This component:
- Detects the current network the user is connected to
- Shows a green indicator when connected to Base Sepolia (correct)
- Shows a prominent warning when connected to the wrong network
- Provides a button to automatically switch to Base Sepolia

### 2. Updated Components with Network Checking

All transaction components now check the network before allowing any blockchain interactions:

#### `wallet-connect.tsx`
- Now displays network status (Base Sepolia ✓ or Wrong Network ⚠️)
- Shows visual indicators for correct/incorrect network

#### `mint-passport.tsx`
- Blocks minting if not on Base Sepolia
- Shows network switcher and warning
- Only allows transactions on Base Sepolia testnet

#### `create-event.tsx`
- Prevents event creation on wrong network
- Shows network switcher if on wrong network
- Disables submit button when network is incorrect

#### `claim-stamp.tsx`
- Prevents stamp claiming on wrong network
- Shows network switcher if on wrong network
- Disables claim button when network is incorrect

## How It Works

### Network Detection
```typescript
import { useChainId } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

const chainId = useChainId()
const isCorrectNetwork = chainId === baseSepolia.id // 84532
```

### Automatic Network Switching
```typescript
import { useSwitchChain } from 'wagmi'

const { switchChain } = useSwitchChain()
switchChain({ chainId: baseSepolia.id })
```

## What Users Will See

### When Connected to Base Sepolia (Correct) ✅
- Green indicator showing "Base Sepolia" with pulsing dot
- All buttons and features work normally
- Can mint passports, create events, and claim stamps

### When Connected to Wrong Network (e.g., Base Mainnet) ⚠️
- Red warning banner with clear message
- "Switch to Base Sepolia" button
- All transaction buttons are disabled
- Warning message: "🚨 DO NOT TRANSACT ON BASE MAINNET - You'll spend real ETH! 🚨"

## Testing the Fix

### 1. Check Current Network
1. Open your app
2. Connect your MetaMask wallet
3. Look at the network indicator in the header

### 2. Test Network Switching
1. In MetaMask, switch to Base Mainnet
2. Your app should immediately show a red "Wrong Network" indicator
3. Click "Switch to Base Sepolia" button
4. MetaMask should prompt you to switch networks
5. After switching, the indicator should turn green

### 3. Verify Transaction Blocking
1. While on Base Mainnet (or any wrong network):
   - Try to mint a passport → Should be blocked
   - Try to create an event → Should be blocked
   - Try to claim a stamp → Should be blocked
2. Switch to Base Sepolia
3. All functions should work normally

## Important Configuration

### Wagmi Config (`frontend/src/config/wagmi.ts`)
```typescript
export const config = createConfig({
  chains: [baseSepolia], // Only Base Sepolia is allowed
  // ...
})
```

### Contract Address (`frontend/src/config/contract.ts`)
```typescript
export const basePassAddress = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
  '0x65AaFd972B45dd0108BFeDc1830C56a95fc52310'
) as `0x${string}`
```

**⚠️ CRITICAL:** Verify this contract address is deployed on Base Sepolia, not Base Mainnet!

## Verifying Your Contract

1. Go to Base Sepolia Explorer: https://sepolia.basescan.org/
2. Enter your contract address: `0x65AaFd972B45dd0108BFeDc1830C56a95fc52310`
3. Verify the contract exists and has the correct code

If the contract doesn't exist on Base Sepolia, you need to:
1. Deploy the contract to Base Sepolia testnet
2. Update the contract address in `frontend/src/config/contract.ts`

## Network Information

### Base Sepolia Testnet (✅ Correct)
- **Chain ID:** 84532
- **Network Name:** Base Sepolia
- **RPC URL:** https://sepolia.base.org
- **Block Explorer:** https://sepolia.basescan.org
- **Currency:** SepoliaETH (test ETH, no value)
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Base Mainnet (❌ Wrong - Costs Real Money)
- **Chain ID:** 8453
- **Network Name:** Base
- **RPC URL:** https://mainnet.base.org
- **Block Explorer:** https://basescan.org
- **Currency:** ETH (real ETH, has value)

## Troubleshooting

### Users Still Seeing Wrong Network
1. Clear browser cache
2. Disconnect and reconnect wallet
3. Manually add Base Sepolia to MetaMask if not present

### Contract Not Found on Base Sepolia
1. Check deployment logs
2. Redeploy using: `npx hardhat run scripts/deploy.ts --network baseSepolia`
3. Update contract address in `frontend/src/config/contract.ts`

### Transactions Still Going to Mainnet
1. Verify wagmi config has ONLY baseSepolia in chains array
2. Check MetaMask is actually on Base Sepolia (not just showing it)
3. Check browser console for any errors

## Summary

Your application is now **SAFE** and will:
- ✅ Only allow transactions on Base Sepolia testnet
- ✅ Show clear warnings when on wrong network
- ✅ Prevent accidental spending of real ETH
- ✅ Provide easy network switching
- ✅ Display network status at all times

**No more mainnet transactions!** 🎉


