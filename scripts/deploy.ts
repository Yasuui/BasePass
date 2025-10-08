/**
 * BasePass Contract Deployment Script
 * 
 * This script deploys the BasePass contract to the specified network.
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
  console.log("🚀 Starting BasePass deployment...")
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

  // Get the contract factory
  console.log("📦 Getting BasePass contract factory...")
  const BasePass = await ethers.getContractFactory("BasePass")

  // Deploy the contract
  console.log("⏳ Deploying BasePass contract...")
  const basePass = await BasePass.deploy()
  
  // Wait for deployment to complete
  await basePass.waitForDeployment()

  // Get the deployed contract address
  const address = await basePass.getAddress()
  console.log("\n✅ BasePass deployed successfully!")
  console.log("=====================================")
  console.log(`📍 Contract address: ${address}`)
  console.log("=====================================\n")

  // Verify initial state
  console.log("🔍 Verifying initial contract state...")
  const totalPassports = await basePass.totalPassports()
  const totalEvents = await basePass.totalEvents()
  const owner = await basePass.owner()

  console.log(`   Total Passports: ${totalPassports}`)
  console.log(`   Total Events: ${totalEvents}`)
  console.log(`   Contract Owner: ${owner}`)

  // Save deployment info
  console.log("\n📝 Deployment Information:")
  console.log("=====================================")
  console.log(`Network: ${network.name}`)
  console.log(`Chain ID: ${network.chainId}`)
  console.log(`Contract: ${address}`)
  console.log(`Deployer: ${deployer.address}`)
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`)
  console.log("=====================================")

  // Network-specific instructions
  if (network.chainId === 84532n) {
    console.log("\n🔗 Base Sepolia Testnet")
    console.log(`View on BaseScan: https://sepolia.basescan.org/address/${address}`)
    console.log("\n📋 Next steps:")
    console.log("1. Verify contract on BaseScan")
    console.log("2. Update frontend config with contract address")
    console.log("3. Test contract functions on testnet")
  } else if (network.chainId === 1337n || network.chainId === 31337n) {
    console.log("\n🏠 Local Hardhat Network")
    console.log("Contract is ready for local testing")
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

