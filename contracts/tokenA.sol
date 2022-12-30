pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TokenA is ERC20 {
    constructor(address _a1,address _a2,address _a3,address _a4) ERC20("MyTokenB", "MTKB"){
        _mint(msg.sender, 100000000000 * 10 ** decimals());
        _mint(_a1, 100000000000 * 10 ** decimals());
        _mint(_a2, 100000000000 * 10 ** decimals());
        _mint(_a3, 100000000000 * 10 ** decimals());
        _mint(_a4, 100000000000 * 10 ** decimals());
    }
}