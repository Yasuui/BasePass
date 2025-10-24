// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EventStamp - Non-Transferable Event Attendance NFTs
 * @author Yonis D
 * @notice This contract manages event stamp NFTs that prove attendance at specific events
 * @dev Extends ERC721 with non-transferable (soulbound) functionality
 * 
 * Key Features:
 * - Stamp NFTs: Each stamp represents attendance at a specific event
 * - Non-Transferable: Stamps are soulbound and cannot be transferred after minting
 * - Metadata: Each stamp stores eventId, passportId, and timestamp
 * - Access Control: Only authorized minter (BasePass contract) can mint stamps
 * - Enumerable: Allows querying all stamps owned by an address
 */
contract EventStamp is ERC721, ERC721Enumerable, AccessControl {
    /// @notice Role identifier for addresses authorized to mint stamps
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Counter for stamp token IDs
    uint256 private _tokenIdCounter;

    /**
     * @notice Metadata for each stamp NFT
     * @param eventId The ID of the event this stamp represents
     * @param passportId The passport token ID that claimed this stamp
     * @param timestamp Unix timestamp when the stamp was claimed
     */
    struct StampMetadata {
        uint256 eventId;
        uint256 passportId;
        uint256 timestamp;
    }

    /// @notice Mapping of stamp token IDs to their metadata
    /// @dev tokenId => StampMetadata
    mapping(uint256 => StampMetadata) public stampMetadata;

    /// @notice Emitted when a new stamp is minted
    /// @param to Address receiving the stamp
    /// @param tokenId ID of the minted stamp token
    /// @param eventId ID of the event
    /// @param passportId ID of the passport
    event StampMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed eventId,
        uint256 passportId
    );

    /**
     * @notice Constructor initializes the ERC721 token and access control
     * @dev Sets up MINTER_ROLE and DEFAULT_ADMIN_ROLE for the deployer
     */
    constructor() ERC721("BasePass Event Stamp", "BPSTAMP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _tokenIdCounter = 1; // Start token IDs at 1
    }

    /**
     * @notice Mints a new stamp NFT
     * @dev Only callable by addresses with MINTER_ROLE (typically the BasePass contract)
     * @param to Address to receive the stamp
     * @param eventId ID of the event this stamp represents
     * @param passportId ID of the passport claiming the stamp
     * @return tokenId The ID of the newly minted stamp
     * 
     * Requirements:
     * - Caller must have MINTER_ROLE
     * 
     * Emits a {StampMinted} event
     */
    function mintStamp(
        address to,
        uint256 eventId,
        uint256 passportId
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        stampMetadata[tokenId] = StampMetadata({
            eventId: eventId,
            passportId: passportId,
            timestamp: block.timestamp
        });

        emit StampMinted(to, tokenId, eventId, passportId);
        return tokenId;
    }

    /**
     * @notice Override _update to make stamps non-transferable (soulbound)
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
    ) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);

        // Only allow minting (from == address(0))
        // Block all transfers (from != address(0))
        require(from == address(0), "EventStamp: stamps are non-transferable (soulbound)");

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Returns all stamp token IDs owned by an address for a specific event
     * @param owner Address to query
     * @param eventId Event ID to filter by
     * @return stampIds Array of stamp token IDs
     */
    function getStampsByEvent(address owner, uint256 eventId)
        external
        view
        returns (uint256[] memory)
    {
        uint256 balance = balanceOf(owner);
        uint256[] memory tempStamps = new uint256[](balance);
        uint256 count = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (stampMetadata[tokenId].eventId == eventId) {
                tempStamps[count] = tokenId;
                count++;
            }
        }

        // Create properly sized array
        uint256[] memory stampIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            stampIds[i] = tempStamps[i];
        }

        return stampIds;
    }

    /**
     * @notice Returns the total number of stamps minted
     * @return uint256 Total stamp count
     */
    function totalStamps() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @notice Checks if a passport owner has a stamp for a specific event
     * @param owner Address of the passport owner
     * @param eventId ID of the event to check
     * @return bool True if the owner has a stamp for the event
     */
    function hasStampForEvent(address owner, uint256 eventId) external view returns (bool) {
        uint256 balance = balanceOf(owner);
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (stampMetadata[tokenId].eventId == eventId) {
                return true;
            }
        }
        
        return false;
    }

    // Required overrides for ERC721Enumerable
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Returns token URI with metadata
     * @dev Returns a data URI with JSON metadata
     * @param tokenId The token ID to get URI for
     * @return string The token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        StampMetadata memory metadata = stampMetadata[tokenId];
        
        // For MVP, return a simple JSON data URI
        // In production, this would point to IPFS or generate full metadata
        return string(
            abi.encodePacked(
                "data:application/json;utf8,",
                '{"name":"Event Stamp #',
                _toString(tokenId),
                '","description":"Proof of attendance at event #',
                _toString(metadata.eventId),
                '","attributes":[{"trait_type":"Event ID","value":"',
                _toString(metadata.eventId),
                '"},{"trait_type":"Passport ID","value":"',
                _toString(metadata.passportId),
                '"},{"trait_type":"Claimed At","value":"',
                _toString(metadata.timestamp),
                '"}]}'
            )
        );
    }

    /**
     * @dev Helper function to convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

