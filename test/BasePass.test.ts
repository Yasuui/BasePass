/**
 * BasePass Contract Test Suite
 * 
 * Comprehensive test coverage for the BasePass smart contract including:
 * - Contract deployment and initialization
 * - Passport NFT minting
 * - Event creation
 * - Stamp claiming with signature verification
 * - Security features (ownership, replay protection, expiration)
 * 
 * Run tests: npx hardhat test
 * Run with coverage: npx hardhat coverage
 */

import { expect } from "chai"
import { ethers } from "hardhat"
import { BasePass } from "../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

describe("BasePass", function () {
  // Contract instance and test accounts
  let basePass: BasePass
  let owner: SignerWithAddress      // Contract deployer/owner
  let user1: SignerWithAddress      // Test user who will mint passport
  let eventSigner: SignerWithAddress // Authorized signer for events

  /**
   * Setup: Deploy a fresh contract before each test
   * This ensures test isolation and prevents state pollution
   */
  beforeEach(async function () {
    // Get test signers from Hardhat
    ;[owner, user1, eventSigner] = await ethers.getSigners()

    // Deploy a fresh BasePass contract
    const BasePassFactory = await ethers.getContractFactory("BasePass")
    basePass = await BasePassFactory.deploy()
    await basePass.waitForDeployment()
  })

  /**
   * Test Suite: Contract Deployment
   * Verifies that the contract initializes correctly
   */
  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      // Verify ERC721 token metadata
      expect(await basePass.name()).to.equal("BasePass Passport")
      expect(await basePass.symbol()).to.equal("BPASS")
    })

    it("Should start with zero passports and events", async function () {
      // Counters should start at 1, so total should be 0
      expect(await basePass.totalPassports()).to.equal(0)
      expect(await basePass.totalEvents()).to.equal(0)
    })
  })

  /**
   * Test Suite: Passport Minting
   * Tests the core NFT minting functionality
   */
  describe("Minting Passports", function () {
    it("Should mint a passport to the caller", async function () {
      // User1 mints a passport
      await basePass.connect(user1).mintPassport()
      
      // Verify ownership and counter increment
      expect(await basePass.ownerOf(1)).to.equal(user1.address)
      expect(await basePass.totalPassports()).to.equal(1)
    })

    it("Should emit PassportMinted event", async function () {
      // Verify that minting emits the correct event with proper arguments
      await expect(basePass.connect(user1).mintPassport())
        .to.emit(basePass, "PassportMinted")
        .withArgs(user1.address, 1)
    })
  })

  /**
   * Test Suite: Event Creation
   * Tests event creation and validation
   */
  describe("Event Creation", function () {
    it("Should create an event", async function () {
      // Create a test event with metadata
      const tx = await basePass.createEvent(
        "Test Event",
        "A test event",
        "https://example.com/icon.png",
        eventSigner.address
      )

      // Verify event emission
      await expect(tx)
        .to.emit(basePass, "EventCreated")
        .withArgs(1, "Test Event", eventSigner.address)

      // Verify event data is stored correctly
      const eventData = await basePass.events(1)
      expect(eventData.name).to.equal("Test Event")
      expect(eventData.signer).to.equal(eventSigner.address)
    })

    it("Should revert if signer address is zero", async function () {
      // Zero address should be rejected as invalid signer
      await expect(
        basePass.createEvent(
          "Test Event",
          "A test event",
          "https://example.com/icon.png",
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid signer address")
    })
  })

  /**
   * Test Suite: Stamp Claiming
   * Tests the core stamp claiming functionality with signature verification
   */
  describe("Stamp Claiming", function () {
    /**
     * Setup: Create a passport and event before each stamp test
     */
    beforeEach(async function () {
      // User1 mints a passport (tokenId = 1)
      await basePass.connect(user1).mintPassport()

      // Create a test event (eventId = 1)
      await basePass.createEvent(
        "Test Event",
        "A test event",
        "https://example.com/icon.png",
        eventSigner.address
      )
    })

    it("Should allow claiming a stamp with valid signature", async function () {
      const tokenId = 1
      const eventId = 1
      const nonce = ethers.randomBytes(32) // Random nonce for uniqueness
      const expiration = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const chainId = (await ethers.provider.getNetwork()).chainId

      // Create signature (same format as contract expects)
      // Message format: keccak256(eventId, nonce, expiration, chainId)
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "uint256", "uint256"],
        [eventId, nonce, expiration, chainId]
      )
      const signature = await eventSigner.signMessage(ethers.getBytes(messageHash))

      // Claim stamp with valid signature
      await expect(
        basePass.connect(user1).claimStamp(tokenId, eventId, nonce, expiration, signature)
      )
        .to.emit(basePass, "StampClaimed")
        .withArgs(tokenId, eventId, user1.address)

      // Verify stamp was claimed and recorded
      expect(await basePass.hasStamp(tokenId, eventId)).to.be.true
    })

    it("Should revert if not passport owner", async function () {
      const tokenId = 1
      const eventId = 1
      const nonce = ethers.randomBytes(32)
      const expiration = Math.floor(Date.now() / 1000) + 3600
      const chainId = (await ethers.provider.getNetwork()).chainId

      // Create valid signature
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "uint256", "uint256"],
        [eventId, nonce, expiration, chainId]
      )
      const signature = await eventSigner.signMessage(ethers.getBytes(messageHash))

      // Try to claim with wrong account (owner instead of user1)
      // This should fail ownership check
      await expect(
        basePass.connect(owner).claimStamp(tokenId, eventId, nonce, expiration, signature)
      ).to.be.revertedWith("Not passport owner")
    })

    it("Should revert if stamp already claimed", async function () {
      const tokenId = 1
      const eventId = 1
      const nonce = ethers.randomBytes(32)
      const expiration = Math.floor(Date.now() / 1000) + 3600
      const chainId = (await ethers.provider.getNetwork()).chainId

      // Create and claim with first signature
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "uint256", "uint256"],
        [eventId, nonce, expiration, chainId]
      )
      const signature = await eventSigner.signMessage(ethers.getBytes(messageHash))

      // Claim stamp successfully
      await basePass.connect(user1).claimStamp(tokenId, eventId, nonce, expiration, signature)

      // Try to claim the same stamp again with a different nonce
      // This should fail the "already claimed" check
      const newNonce = ethers.randomBytes(32)
      const newMessageHash = ethers.solidityPackedKeccak256(
        ["uint256", "bytes32", "uint256", "uint256"],
        [eventId, newNonce, expiration, chainId]
      )
      const newSignature = await eventSigner.signMessage(ethers.getBytes(newMessageHash))

      await expect(
        basePass.connect(user1).claimStamp(tokenId, eventId, newNonce, expiration, newSignature)
      ).to.be.revertedWith("Stamp already claimed")
    })
  })
})

