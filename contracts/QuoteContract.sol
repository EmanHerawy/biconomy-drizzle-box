pragma solidity 0.6.2;

import "./BasicMetaTransaction.sol";

contract QuoteContract is BasicMetaTransaction {

    string public quote;
    address public owner;

    function setQuote(string memory newQuote) public {
        quote = newQuote;
        owner = _msgSender();
    }

    function getQuote() public view returns(string memory currentQuote, address currentOwner) {
        currentQuote = quote;
        currentOwner = owner;
    }
}