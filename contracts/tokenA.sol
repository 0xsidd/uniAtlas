pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TokenA is ERC20 {
    constructor() ERC20("MyToken", "MTK"){
        _mint(msg.sender, 100000000000 * 10 ** decimals());
    }
}