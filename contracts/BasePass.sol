// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./EventStamp.sol";

/**
 * @title BasePass - Onchain Event Passport System
 * @author Yonis D
 * @notice This contract implements an onchain passport NFT system for event attendance tracking
 * @dev Extends ERC721 with signature-based stamp claiming for proof of attendance
 * 
 * Key Features:
 * - Passport NFT: Attendees mint a single passport NFT to their wallet
 * - Event Creation: Event organizers can create events with authorized signers
 * - Stamp Claiming: Attendees scan signed QR codes to claim event stamps
 * - Security: ECDSA signature verification, nonce-based replay protection, expiration timestamps
 * 
 * Use Cases:
 * - Conference attendance tracking
 * - Workshop participation proof
 * - Community event engagement
 * - Loyalty and rewards programs
 */
contract BasePass is ERC721, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @dev Counter for passport token IDs, starts at 1
    uint256 private _tokenIdCounter;

    /// @dev Counter for event IDs, starts at 1
    uint256 private _eventIdCounter;

    /// @notice Reference to the EventStamp contract for minting stamp NFTs
    EventStamp public immutable stampContract;

    /// @notice Mapping to prevent replay attacks by tracking used nonces
    /// @dev nonce => used status
    mapping(bytes32 => bool) public usedNonces;

    /**
     * @notice Event metadata structure
     * @param id Unique identifier for the event
     * @param name Human-readable event name
     * @param description Event description
     * @param iconUrl URL to event icon/image
     * @param signer Address authorized to sign QR codes for this event
     * @param exists Flag to check if event exists (prevents default value confusion)
     */
    struct Event {
        uint256 id;
        string name;
        string description;
        string iconUrl;
        address signer;
        bool exists;
    }

    /// @notice Mapping of event IDs to event data
    /// @dev eventId => Event struct
    mapping(uint256 => Event) public events;

    /// @notice Mapping to track last event creation time per address for rate limiting
    /// @dev address => timestamp of last event creation
    mapping(address => uint256) public lastEventCreation;

    /// @notice Cooldown period between event creations (1 hour)
    uint256 public constant EVENT_COOLDOWN = 1 hours;

    /// @notice Emitted when a new passport NFT is minted
    /// @param owner Address that received the passport
    /// @param tokenId ID of the minted passport token
    event PassportMinted(address indexed owner, uint256 indexed tokenId);
    
    /// @notice Emitted when a new event is created
    /// @param eventId ID of the created event
    /// @param name Name of the event
    /// @param signer Address authorized to sign for this event
    event EventCreated(uint256 indexed eventId, string name, address indexed signer);
    
    /// @notice Emitted when a stamp is successfully claimed
    /// @param tokenId Passport token ID that received the stamp
    /// @param eventId Event ID of the claimed stamp
    /// @param claimer Address that claimed the stamp
    event StampClaimed(uint256 indexed tokenId, uint256 indexed eventId, address indexed claimer);

    /**
     * @notice Constructor initializes the ERC721 token and ownership
     * @dev Sets token name to "BasePass Passport" and symbol to "BPASS"
     * @dev Initializes counters at 1 to avoid using tokenId/eventId of 0
     * @param _stampContract Address of the EventStamp contract for minting stamps
     * 
     * Requirements:
     * - _stampContract cannot be the zero address
     */
    constructor(address _stampContract) ERC721("BasePass Passport", "BPASS") Ownable(msg.sender) {
        require(_stampContract != address(0), "Invalid stamp contract address");
        stampContract = EventStamp(_stampContract);
        _tokenIdCounter = 1;
        _eventIdCounter = 1;
    }

    /**
     * @notice Mints a new passport NFT to the caller
     * @dev Uses _safeMint to ensure recipient can handle ERC721 tokens
     * @dev Protected by nonReentrant modifier to prevent reentrancy attacks
     * @dev Limited to one passport per wallet (soulbound identity)
     * 
     * Requirements:
     * - Caller must not already own a passport
     * 
     * Emits a {PassportMinted} event
     */
    function mintPassport() external nonReentrant {
        require(balanceOf(msg.sender) == 0, "Already owns a passport");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        emit PassportMinted(msg.sender, tokenId);
    }

    /**
     * @notice Creates a new event with metadata and authorized signer
     * @dev Includes rate limiting and input validation to prevent abuse
     * @param name Human-readable name for the event
     * @param description Detailed description of the event
     * @param iconUrl URL pointing to event icon/image (e.g., IPFS link)
     * @param signer Address authorized to sign QR codes for stamp claims
     * @return eventId The ID of the newly created event
     * 
     * Requirements:
     * - Rate limit: Must wait EVENT_COOLDOWN (1 hour) between creations
     * - Name: Must be between 1-100 characters
     * - Description: Must not exceed 500 characters
     * - Signer: Cannot be the zero address
     * 
     * Emits an {EventCreated} event
     * 
     * @dev The signer address is crucial - only signatures from this address
     *      will be accepted when claiming stamps for this event
     */
    function createEvent(
        string memory name,
        string memory description,
        string memory iconUrl,
        address signer
    ) external returns (uint256) {
        // Rate limiting: enforce cooldown between event creations
        require(
            block.timestamp >= lastEventCreation[msg.sender] + EVENT_COOLDOWN,
            "Rate limit: wait 1 hour between creating events"
        );

        // Input validation
        require(signer != address(0), "Invalid signer address");
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Name must be 1-100 characters");
        require(bytes(description).length <= 500, "Description must not exceed 500 characters");
        
        // Update rate limiting tracker
        lastEventCreation[msg.sender] = block.timestamp;

        uint256 eventId = _eventIdCounter;
        _eventIdCounter++;

        events[eventId] = Event({
            id: eventId,
            name: name,
            description: description,
            iconUrl: iconUrl,
            signer: signer,
            exists: true
        });

        emit EventCreated(eventId, name, signer);
        return eventId;
    }

    /**
     * @notice Claims a stamp for a passport using a signed QR code
     * @dev This is the core function for proof of attendance - validates signature and mints stamp NFT
     * @param tokenId The passport token ID to receive the stamp
     * @param eventId The event ID to claim the stamp for
     * @param nonce Unique random value to prevent replay attacks
     * @param expiration Unix timestamp when this signature expires
     * @param signature ECDSA signature from the event's authorized signer
     * 
     * Requirements:
     * - Caller must own the passport token
     * - Event must exist
     * - Stamp must not have been claimed already for this passport
     * - Nonce must not have been used before (prevents replay attacks)
     * - Current time must be before expiration
     * - Signature must be valid and from the event's authorized signer
     * 
     * Emits a {StampClaimed} event
     * 
     * @dev Signature verification process:
     *      1. Hash the claim data (eventId, nonce, expiration, chainId)
     *      2. Convert to Ethereum signed message hash
     *      3. Recover the signer address from the signature
     *      4. Verify it matches the event's authorized signer
     * 
     * @dev Security features:
     *      - nonReentrant: Prevents reentrancy attacks
     *      - Nonce tracking: Prevents signature reuse
     *      - Expiration: Limits signature validity period
     *      - Chain ID: Prevents cross-chain replay attacks
     */
    function claimStamp(
        uint256 tokenId,
        uint256 eventId,
        bytes32 nonce,
        uint256 expiration,
        bytes memory signature
    ) external nonReentrant {
        // Verify ownership
        require(ownerOf(tokenId) == msg.sender, "Not passport owner");

        // Verify event exists
        require(events[eventId].exists, "Event does not exist");

        // Verify not already claimed (check if passport owner has stamp for this event)
        require(!stampContract.hasStampForEvent(msg.sender, eventId), "Stamp already claimed");

        // Verify nonce not used
        require(!usedNonces[nonce], "Nonce already used");

        // Verify not expired
        require(block.timestamp <= expiration, "Signature expired");

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(eventId, nonce, expiration, block.chainid)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);

        require(recoveredSigner == events[eventId].signer, "Invalid signature");

        // Mark nonce as used
        usedNonces[nonce] = true;

        // Mint stamp NFT to passport owner
        stampContract.mintStamp(msg.sender, eventId, tokenId);

        emit StampClaimed(tokenId, eventId, msg.sender);
    }

    /**
     * @notice Retrieves event details by event ID
     * @param eventId The ID of the event to retrieve
     * @return Event struct containing all event metadata
     * 
     * Requirements:
     * - Event must exist
     */
    function getEvent(uint256 eventId) external view returns (Event memory) {
        require(events[eventId].exists, "Event does not exist");
        return events[eventId];
    }

    /**
     * @notice Checks if a passport has claimed a specific event stamp
     * @param tokenId The passport token ID to check
     * @param eventId The event ID to check
     * @return bool True if the stamp has been claimed, false otherwise
     * @dev Queries the EventStamp contract to check if the passport owner has a stamp for this event
     */
    function hasStamp(uint256 tokenId, uint256 eventId) external view returns (bool) {
        address passportOwner = ownerOf(tokenId);
        return stampContract.hasStampForEvent(passportOwner, eventId);
    }

    /**
     * @notice Returns all stamp token IDs for a passport owner
     * @param passportOwner Address of the passport owner
     * @return stampIds Array of stamp token IDs owned by the passport holder
     */
    function getPassportStamps(address passportOwner) external view returns (uint256[] memory) {
        uint256 stampBalance = stampContract.balanceOf(passportOwner);
        uint256[] memory stampIds = new uint256[](stampBalance);
        
        for (uint256 i = 0; i < stampBalance; i++) {
            stampIds[i] = stampContract.tokenOfOwnerByIndex(passportOwner, i);
        }
        
        return stampIds;
    }

    /**
     * @notice Returns the total number of passports minted
     * @return uint256 Total passport count
     * @dev Subtracts 1 because counter starts at 1
     */
    function totalPassports() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @notice Returns the total number of events created
     * @return uint256 Total event count
     * @dev Subtracts 1 because counter starts at 1
     */
    function totalEvents() external view returns (uint256) {
        return _eventIdCounter - 1;
    }

    /**
     * @notice Override _update to make passports non-transferable (soulbound)
     * @dev Only allows minting (from == address(0)), blocks all transfers
     * @param to Address receiving the token
     * @param tokenId Token ID being transferred
     * @param auth Address authorized to perform the update
     * @return address The previous owner of the token
     * 
     * Requirements:
     * - Can only be called during minting (from must be zero address)
     * - All transfer attempts will revert
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Only allow minting (from == address(0))
        // Block all transfers (from != address(0))
        require(from == address(0), "BasePass: passports are non-transferable (soulbound)");
        
        return super._update(to, tokenId, auth);
    }
}

