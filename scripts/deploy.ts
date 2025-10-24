/**
 * BasePass & EventStamp Contract Deployment Script
 * 
 * This script deploys both EventStamp and BasePass contracts to the specified network.
 * Deployment order matters: EventStamp must be deployed first as BasePass depends on it.
 * 
 * Usage:
 * - Local network: npx hardhat run scripts/deploy.ts
 * - Base Sepolia: npx hardhat run scripts/deploy.ts --network baseSepolia
 * 
 * Make sure to configure your .env file with:
 * - BASE_SEPOLIA_RPC_URL: Your RPC endpoint
 * - PRIVATE_KEY: Deployer's private key (keep this secret!)
 */

import { ethers } from "hardhat"

async function main() {
  console.log("🚀 Starting BasePass System Deployment...")
  console.log("=====================================")

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log(`📝 Deploying with account: ${deployer.address}`)

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`)

  // Get the network information
  const network = await ethers.provider.getNetwork()
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`)
  console.log("=====================================\n")

  // STEP 1: Deploy EventStamp Contract
  console.log("📦 Step 1/2: Deploying EventStamp contract...")
  const EventStamp = await ethers.getContractFactory("EventStamp")
  const eventStamp = await EventStamp.deploy()
  await eventStamp.waitForDeployment()
  const stampAddress = await eventStamp.getAddress()
  
  console.log("✅ EventStamp deployed successfully!")
  console.log(`📍 EventStamp address: ${stampAddress}\n`)

  // STEP 2: Deploy BasePass Contract (with EventStamp address)
  console.log("📦 Step 2/2: Deploying BasePass contract...")
  const BasePass = await ethers.getContractFactory("BasePass")
  const basePass = await BasePass.deploy(stampAddress)
  await basePass.waitForDeployment()
  const basePassAddress = await basePass.getAddress()
  
  console.log("✅ BasePass deployed successfully!")
  console.log(`📍 BasePass address: ${basePassAddress}\n`)

  // STEP 3: Grant MINTER_ROLE to BasePass contract
  console.log("🔐 Step 3/3: Granting MINTER_ROLE to BasePass...")
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"))
  const grantTx = await eventStamp.grantRole(MINTER_ROLE, basePassAddress)
  await grantTx.wait()
  console.log("✅ MINTER_ROLE granted successfully!\n")

  // Verify deployment
  console.log("🔍 Verifying deployment...")
  const totalPassports = await basePass.totalPassports()
  const totalEvents = await basePass.totalEvents()
  const totalStamps = await eventStamp.totalStamps()
  const owner = await basePass.owner()
  const hasRole = await eventStamp.hasRole(MINTER_ROLE, basePassAddress)

  console.log("=====================================")
  console.log("📊 Contract State:")
  console.log(`   Total Passports: ${totalPassports}`)
  console.log(`   Total Events: ${totalEvents}`)
  console.log(`   Total Stamps: ${totalStamps}`)
  console.log(`   Contract Owner: ${owner}`)
  console.log(`   BasePass can mint stamps: ${hasRole}`)
  console.log("=====================================\n")

  // Save deployment info
  console.log("📝 Deployment Summary:")
  console.log("=====================================")
  console.log(`Network: ${network.name}`)
  console.log(`Chain ID: ${network.chainId}`)
  console.log(`EventStamp: ${stampAddress}`)
  console.log(`BasePass: ${basePassAddress}`)
  console.log(`Deployer: ${deployer.address}`)
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`)
  console.log("=====================================")

  // Network-specific instructions
  if (network.chainId === 84532n) {
    console.log("\n🔗 Base Sepolia Testnet")
    console.log(`EventStamp: https://sepolia.basescan.org/address/${stampAddress}`)
    console.log(`BasePass: https://sepolia.basescan.org/address/${basePassAddress}`)
    console.log("\n📋 Next steps:")
    console.log("1. Verify both contracts on BaseScan")
    console.log("2. Update frontend/.env.local:")
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${basePassAddress}`)
    console.log(`   NEXT_PUBLIC_STAMP_CONTRACT_ADDRESS=${stampAddress}`)
    console.log("3. Update frontend/src/config/contract.ts with new ABIs")
    console.log("4. Test the complete flow on testnet")
  } else if (network.chainId === 1337n || network.chainId === 31337n) {
    console.log("\n🏠 Local Hardhat Network")
    console.log("Contracts are ready for local testing")
    console.log("\n📋 Update frontend/.env.local:")
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${basePassAddress}`)
    console.log(`   NEXT_PUBLIC_STAMP_CONTRACT_ADDRESS=${stampAddress}`)
  }

  console.log("\n✨ Deployment complete!\n")
}

// Execute the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!")
    console.error(error)
    process.exit(1)
  })

