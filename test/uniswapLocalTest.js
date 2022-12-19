const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { ecsign } = require("ethereumjs-util");
// const { default: Wallet } = require("ethereumjs-wallet");

describe("Token contract", function () {
    let signer;
    let uniswapV2Router;
    let uniswapV2Factory;
    let uniswapV2Pair;
    let tokenA;
    let tokenB;
    let taxableToken;
    let getInit;
    let initHash;
    let weth;
    let provider = waffle.provider;


    const TOKEN_A_AMOUNT = ethers.utils.parseEther("100000000");
    const TOKEN_1000000000_AMOUNT = ethers.utils.parseEther("1000000000");
    const TOKEN_B_AMOUNT = ethers.utils.parseEther("100000000");
    const ETH_AMOUNT = ethers.utils.parseEther("1000");
    const AMOUNT_IN_MAX = ethers.utils.parseEther("1000000");
    const amountIn = ethers.utils.parseEther("100");
    const amountOut = ethers.utils.parseEther("10");
    const amountInq = ethers.utils.parseEther("1000");
    const EXCEED_AMOUNT_ETH = ethers.utils.parseEther("1005");
    const EXCEED_AMOUNT_TOKEN = ethers.utils.parseEther("1000005");
    const TOKEN_A_AMOUNTU = 10000;
    const TOKEN_B_AMOUNTU = 10000;
    const TOKEN_A_AMOUNTA = 100;
    const TOKEN_B_AMOUNTA = 100;
    
    const TOKEN_100_AMOUNT = ethers.utils.parseEther("100");
    const TOKEN_1_AMOUNT = ethers.utils.parseEther("1");




    async function getPermitSignature(signer, token, spender, value, deadline) {
        const [nonce, name, version, chainId] = await Promise.all([
          token.nonces(signer.address),
          token.name(),
          "1",
          signer.getChainId(),
        ])
        // console.log(chainId);
      
        return ethers.utils.splitSignature(
          await signer._signTypedData(
            {
              name,
              version,
              chainId,
              verifyingContract: token.address,
            },
            {
              Permit: [
                {
                  name: "owner",
                  type: "address",
                },
                {
                  name: "spender",
                  type: "address",
                },
                {
                  name: "value",
                  type: "uint256",
                },
                {
                  name: "nonce",
                  type: "uint256",
                },
                {
                  name: "deadline",
                  type: "uint256",
                },
              ],
            },
            {
              owner: signer.address,
              spender,
              value,
              nonce,
              deadline,
            }
          )
        )
    };
    async function _addLiquidity(){
        await tokenA.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_A_AMOUNT);
        await tokenB.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_B_AMOUNT);
        await uniswapV2Router.connect(signer[0]).addLiquidity(tokenA.address,tokenB.address,TOKEN_A_AMOUNT,TOKEN_B_AMOUNT,1,1,signer[0].address, 1764541741);
    };
    async function _addLiquidityETH(){
      await tokenA.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_A_AMOUNT);
      await uniswapV2Router.connect(signer[0]).addLiquidityETH(tokenA.address,TOKEN_A_AMOUNT,1,ETH_AMOUNT,signer[0].address,1764541741,{value:ETH_AMOUNT});
    };
    async function _addLiquiditytxble(){
        await tokenA.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_A_AMOUNT);
        await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_A_AMOUNT);
        await uniswapV2Router.connect(signer[0]).addLiquidity(tokenA.address,taxableToken.address,TOKEN_A_AMOUNT,TOKEN_A_AMOUNT,1,1,signer[0].address,1764541741);

    };
    async function _addLiquidityETHtxble(){
        await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_B_AMOUNT);
        await uniswapV2Router.connect(signer[0]).addLiquidityETH(taxableToken.address,TOKEN_A_AMOUNT,1,ETH_AMOUNT,signer[0].address,1764541741,{value:ETH_AMOUNT});
    };
    describe("UniswapV2",async()=>{
      beforeEach(async()=>{
              signer = await ethers.getSigners();
              const GetInit = await ethers.getContractFactory("CalHash");
              getInit = await GetInit.deploy();
              initHash = await getInit.connect(signer[0]).getInitHash();
              const WETH = await ethers.getContractFactory("WETH9");
              weth = await WETH.deploy();
              const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
              uniswapV2Factory = await UniswapV2Factory.connect(signer[0]).deploy(signer[0].address);
              const UniswapV2Router = await ethers.getContractFactory("UniswapV2Router02");
              uniswapV2Router = await UniswapV2Router.connect(signer[0]).deploy(uniswapV2Factory.address,weth.address,signer[11].address,500);
              const TokenA = await ethers.getContractFactory("TokenA");
              tokenA = await TokenA.connect(signer[0]).deploy();
              const TokenB = await ethers.getContractFactory("TokenB");
              tokenB = await TokenB.connect(signer[0]).deploy();

              const TaxableToken = await ethers.getContractFactory("taxableToken");
              taxableToken = await TaxableToken.connect(signer[0]).deploy();
      });
      describe("Functions",async()=>{

        describe("setFee",async()=>{
          it("setFees",async()=>{
            await uniswapV2Router.connect(signer[0]).setFees(500);
          });
        });

        describe("changeFeeCollector",async()=>{
          it("changeFeeCollector",async()=>{
            await uniswapV2Router.connect(signer[0]).changeFeeCollector(signer[8].address);
          });
        });

        describe("swapExactTokensForTokens",async()=>{
          it("swapExactTokensForTokens function", async function () {
            await _addLiquidity();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,1000);
            console.log("Initial Bal TokenB: ", await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            console.log("Final Bal TokenB: ", await tokenB.balanceOf(signer[10].address));
            console.log("Fees Collected: ", await tokenA.balanceOf(signer[11].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });

        describe("swapTokensForExactTokens",async()=>{
          it("swapTokensForExactTokens function", async function () {
            await _addLiquidity();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,1100);
            console.log("Initial Bal TokenB: ", await tokenB.balanceOf(signer[10].address));
            console.log("Initial Bal TokenA: ", await tokenA.balanceOf(signer[0].address));
            const iniBal = await tokenA.balanceOf(signer[0].address);
            // const iniBal = ethers.utils.parseEther(TiniBal);
            
            console.log(await tokenA.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactTokens(1000,1100,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            console.log("Initial Bal TokenA: ", await tokenA.balanceOf(signer[0].address));
            const finalBal = await tokenA.balanceOf(signer[0].address);
            // const finalBal = ethers.utils.parseEther(TfinalBal);
            console.log("Difference: ", iniBal - finalBal);
            console.log("Final Bal TokenB: ", await tokenB.balanceOf(signer[10].address));
            console.log("Fees Collected: ", await tokenA.balanceOf(signer[11].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });

        describe("swapExactETHForTokens",async()=>{
          it("swapExactETHForTokens function", async function () {
            await _addLiquidityETH();
            console.log(await provider.getBalance(signer[11].address));
            console.log(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:TOKEN_1_AMOUNT});
            console.log(await provider.getBalance(signer[11].address));
            console.log(await tokenA.balanceOf(signer[10].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });

        describe("swapTokensForExactETH",async()=>{
          it("swapTokensForExactETH function", async function () {
            await _addLiquidityETH();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_1000000000_AMOUNT);
            // console.log(await tokenA.balanceOf(signer[11].address));
            console.log("fc: ",await provider.getBalance(signer[11].address));

            await uniswapV2Router.connect(signer[0]).swapTokensForExactETH(TOKEN_1_AMOUNT,TOKEN_A_AMOUNT,[tokenA.address,weth.address],signer[10].address,1764541741);
            console.log(await provider.getBalance(signer[10].address));
            console.log("Final Bal Token: ",await tokenA.balanceOf(signer[11].address));
            console.log("fc",await provider.getBalance(signer[11].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapExactTokensForETH",async()=>{
          it("swapExactTokensForETH function", async function () {

            await _addLiquidityETH();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapETHForExactTokens",async()=>{
          it("swapETHForExactTokens function", async function () {
            await _addLiquidityETH();
            console.log("aaaa",await provider.getBalance(signer[11].address));
            await uniswapV2Router.connect(signer[0]).swapETHForExactTokens(amountOut,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            console.log(await provider.getBalance(signer[11].address));
            console.log(await tokenA.balanceOf(signer[10].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapExactTokensForTokensSupportingFeeOnTransferTokens",async()=>{
          it("swapExactTokensForTokensSupportingFeeOnTransferTokens function", async function () {
            await _addLiquiditytxble();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_A_AMOUNT);
            console.log(await tokenA.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokensSupportingFeeOnTransferTokens(TOKEN_A_AMOUNT,1,[tokenA.address,taxableToken.address],signer[10].address, 1764541741);
            console.log(await taxableToken.balanceOf(signer[10].address));
            console.log(await tokenA.balanceOf(signer[11].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);

          });
        });
        describe("swapExactETHForTokensSupportingFeeOnTransferTokens",async()=>{
          it("swapExactETHForTokensSupportingFeeOnTransferTokens", async function () {
            await _addLiquidityETHtxble();
            console.log(await provider.getBalance(signer[11].address));
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokensSupportingFeeOnTransferTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn}); 
            console.log(await provider.getBalance(signer[11].address));
            console.log(await taxableToken.balanceOf(signer[10].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          
          });
        });
        describe("swapExactTokensForETHSupportingFeeOnTransferTokens",async()=>{
          it("swapExactTokensForETHSupportingFeeOnTransferTokens", async function () {
            await _addLiquidityETHtxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            console.log(await taxableToken.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);
            console.log(await taxableToken.balanceOf(signer[11].address));
            // await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            // await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });     
      });
    });
});
