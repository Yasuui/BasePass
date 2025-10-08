// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BasePass - Onchain Event Passport System
 * @author BasePass Team
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

    /// @notice Mapping to track which stamps have been claimed for each passport
    /// @dev tokenId => eventId => claimed status
    mapping(uint256 => mapping(uint256 => bool)) public stamps;

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
     */
    constructor() ERC721("BasePass Passport", "BPASS") Ownable(msg.sender) {
        _tokenIdCounter = 1;
        _eventIdCounter = 1;
    }

    /**
     * @notice Mints a new passport NFT to the caller
     * @dev Uses _safeMint to ensure recipient can handle ERC721 tokens
     * @dev Protected by nonReentrant modifier to prevent reentrancy attacks
     * @dev Anyone can mint a passport - no restrictions
     * 
     * Emits a {PassportMinted} event
     */
    function mintPassport() external nonReentrant {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        emit PassportMinted(msg.sender, tokenId);
    }

    /**
     * @notice Creates a new event with metadata and authorized signer
     * @dev Anyone can create events - consider adding access control for production
     * @param name Human-readable name for the event
     * @param description Detailed description of the event
     * @param iconUrl URL pointing to event icon/image (e.g., IPFS link)
     * @param signer Address authorized to sign QR codes for stamp claims
     * @return eventId The ID of the newly created event
     * 
     * Requirements:
     * - `signer` cannot be the zero address
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
        require(signer != address(0), "Invalid signer address");
        
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
     * @dev This is the core function for proof of attendance - validates signature and records claim
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

        // Verify not already claimed
        require(!stamps[tokenId][eventId], "Stamp already claimed");

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

        // Mark stamp as claimed and nonce as used
        stamps[tokenId][eventId] = true;
        usedNonces[nonce] = true;

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
     */
    function hasStamp(uint256 tokenId, uint256 eventId) external view returns (bool) {
        return stamps[tokenId][eventId];
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
}

