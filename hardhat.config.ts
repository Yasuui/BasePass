/**
 * Hardhat Configuration for BasePass Project
 * 
 * This configuration file sets up the development environment for
 * compiling, testing, and deploying the BasePass smart contract.
 * 
 * Networks:
 * - hardhat: Local development network
 * - baseSepolia: Base Sepolia testnet (Layer 2 testnet)
 * 
 * Environment Variables (create a .env file):
 * - BASE_SEPOLIA_RPC_URL: RPC endpoint for Base Sepolia (optional, has default)
 * - PRIVATE_KEY: Deployer account private key (required for testnet deployment)
 * 
 * Documentation:
 * - Hardhat: https://hardhat.org/docs
 * - Base Network: https://docs.base.org
 */

import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "dotenv/config"

const config: HardhatUserConfig = {
  // Solidity compiler configuration
  solidity: {
    version: "0.8.20", // Solidity version compatible with OpenZeppelin v5
    settings: {
      optimizer: {
        enabled: true,  // Enable optimizer for gas efficiency
        runs: 200       // Optimize for typical deployment (200 is standard)
      }
    }
  },
  
  // Network configurations
  networks: {
    // Local Hardhat network for development and testing
    hardhat: {
      chainId: 1337  // Standard chain ID for Hardhat network
    },
    
    // Base Sepolia testnet (Layer 2 testnet)
    // Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532  // Base Sepolia chain ID
    }
  },
  
  // Project paths configuration
  paths: {
    sources: "./contracts",   // Smart contract source files
    tests: "./test",          // Test files
    cache: "./cache",         // Hardhat cache (auto-generated)
    artifacts: "./artifacts"  // Compiled contracts (auto-generated)
  }
}

export default config

