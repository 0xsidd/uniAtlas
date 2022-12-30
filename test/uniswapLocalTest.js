const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const { ContractFunctionVisibility } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { ecsign } = require("ethereumjs-util");

describe("Token contract", function () {
    let signer;
    let uniswapV2Router;
    let uniswapV2Factory;
    let tokenA;
    let tokenB;
    let taxableToken;
    let getInit;
    let initHash;
    let weth;
    let provider = waffle.provider;


    const TOKEN_A_AMOUNT = ethers.utils.parseEther("1000000000");
    const TOKEN_B_AMOUNT = ethers.utils.parseEther("1000000000");
    const ETH_AMOUNT = ethers.utils.parseEther("100");
    const amountIn = ethers.utils.parseEther("15");
    const amountInq = ethers.utils.parseEther("1000");

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
        await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,TOKEN_A_AMOUNT);
        await uniswapV2Router.connect(signer[0]).addLiquidityETH(taxableToken.address,TOKEN_A_AMOUNT,1,ETH_AMOUNT,signer[0].address,1764541741,{value:ETH_AMOUNT});
    };
    async function _setFees(){
      await uniswapV2Router.connect(signer[0]).setFees(10);
    }
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
              uniswapV2Router = await UniswapV2Router.connect(signer[0]).deploy(uniswapV2Factory.address,weth.address,signer[11].address,10);
              const TokenA = await ethers.getContractFactory("TokenA");
              tokenA = await TokenA.connect(signer[0]).deploy(signer[1].address,signer[2].address,signer[3].address,signer[4].address);
              const TokenB = await ethers.getContractFactory("TokenB");
              tokenB = await TokenB.connect(signer[0]).deploy(signer[1].address,signer[2].address,signer[3].address,signer[4].address);

              const TaxableToken = await ethers.getContractFactory("taxableToken");
              taxableToken = await TaxableToken.connect(signer[0]).deploy(signer[1].address,signer[2].address,signer[3].address,signer[4].address);
      });
      describe("Functions",async()=>{
        describe("setFee",async()=>{
          it("setFees",async()=>{
            await uniswapV2Router.connect(signer[0]).setFees(5);
          });
        });
        describe("changeFeeCollector",async()=>{
          it("changeFeeCollector",async()=>{
            await uniswapV2Router.connect(signer[0]).changeFeeCollector(signer[8].address);
          });
        });
        describe("getAmountsIn",async()=>{
          it("getAmountsIn output",async()=>{
            await uniswapV2Router.connect(signer[0]).setFees(10);
            await _addLiquidity();
            let amountsIn = ethers.utils.parseEther("100");
            await uniswapV2Router.getAmountsIn(amountsIn,[tokenA.address,tokenB.address]);
            // console.log(await uniswapV2Router.getAmountsIn(amountsIn,[tokenA.address,tokenB.address]));
          });
        });
        describe("getAmountsOut",async()=>{ 
          it("getAmountsOut output",async()=>{
            await uniswapV2Router.connect(signer[0]).setFees(10);
            await _addLiquidity();
            let amountsIn = ethers.utils.parseEther("100");
            await uniswapV2Router.getAmountsOut(amountsIn,[tokenA.address,tokenB.address]);
          });
        });
        describe("swapExactTokensForTokens",async()=>{
          it("swap test", async function () {
            await _addLiquidity();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("multiple account swap fees test", async function (){
            await _addLiquidity();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal = Number(await tokenB.balanceOf(signer[10].address));
            await expect(Number(await tokenA.balanceOf(signer[11].address))).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);
            

            await tokenA.connect(signer[1]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[1]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount1 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal1 = Number(await tokenB.balanceOf(signer[10].address));
            await expect(feeAmount1).to.be.greaterThan(feeAmount);
            await expect(swapBal1).to.be.greaterThan(swapBal);

            await tokenA.connect(signer[2]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[2]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount2 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal2 = Number(await tokenB.balanceOf(signer[10].address));
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);
            await expect(swapBal2).to.be.greaterThan(swapBal1);

            await tokenA.connect(signer[2]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[2]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount3 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal3 = Number(await tokenB.balanceOf(signer[10].address));
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);
            await expect(swapBal3).to.be.greaterThan(swapBal2);

            await tokenA.connect(signer[3]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[3]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount4 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal4 = Number(await tokenB.balanceOf(signer[10].address));
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);
            await expect(swapBal4).to.be.greaterThan(swapBal3);

            await tokenA.connect(signer[4]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[4]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount5 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal5 = Number(await tokenB.balanceOf(signer[10].address));
            await expect(feeAmount5).to.be.greaterThan(feeAmount4);
            await expect(swapBal5).to.be.greaterThan(swapBal4);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquidity();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokens(1000,1,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            const feeAmount = Number(await tokenA.balanceOf(signer[11].address));

            await expect(feeAmount).to.be.greaterThan(0);
            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapTokensForExactTokens",async()=>{
          it("swap test", async function () {
            await _addLiquidity();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);


            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);

          });
          it("multiple account swap fees test", async function (){
            await _addLiquidity();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            const feeAmount = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal = Number(await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            await expect(Number(await tokenA.balanceOf(signer[11].address))).to.be.greaterThan(0);
            await expect(Number(await tokenB.balanceOf(signer[10].address))).to.be.greaterThan(0);

            let tokenApproveAmount1 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[1]).approve(uniswapV2Router.address,Number(tokenApproveAmount1[0]));
            const feeAmount1 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal1 = Number(await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[1]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            await expect(feeAmount1).to.be.greaterThan(feeAmount);
            await expect(swapBal1).to.be.greaterThan(swapBal);

            let tokenApproveAmount2 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[2]).approve(uniswapV2Router.address,Number(tokenApproveAmount2[0]));
            const feeAmount2 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal2 = Number(await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[2]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);
            await expect(swapBal2).to.be.greaterThan(swapBal1);

            let tokenApproveAmount3 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[3]).approve(uniswapV2Router.address,Number(tokenApproveAmount3[0]));
            const feeAmount3 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal3 = Number(await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[3]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);
            await expect(swapBal3).to.be.greaterThan(swapBal2);

            let tokenApproveAmount4 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[4]).approve(uniswapV2Router.address,Number(tokenApproveAmount4[0]));
            const feeAmount4 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal4 = Number(await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[4]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);
            await expect(swapBal4).to.be.greaterThan(swapBal3);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after multiple swap",async function(){
            await _addLiquidity();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,tokenB.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            const feeAmount = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal = Number(await tokenB.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactTokens(10001,11000,[tokenA.address,tokenB.address],signer[10].address, 1764541741);
            await expect(Number(await tokenA.balanceOf(signer[11].address))).to.be.greaterThan(0);
            await expect(Number(await tokenB.balanceOf(signer[10].address))).to.be.greaterThan(0);
          });
        });
        describe("swapExactETHForTokens",async()=>{
          it("swap test", async function () {
            await _addLiquidityETH();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[0].address, 1764541741,{value:amountIn});
            // console.log(await tokenA.balanceOf(signer[11].address));

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("multiple account swap fees test", async function (){
            await _addLiquidityETH();
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount = Number(await provider.getBalance(signer[11].address));
            const swapBal = Number(await tokenA.balanceOf(signer[10].address));
            await expect(Number(await provider.getBalance(signer[11].address))).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);
            

            await uniswapV2Router.connect(signer[1]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount1 = Number(await provider.getBalance(signer[11].address));
            const swapBal1 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount1).to.be.greaterThan(feeAmount);
            await expect(swapBal1).to.be.greaterThan(swapBal);

            await uniswapV2Router.connect(signer[2]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount2 = Number(await provider.getBalance(signer[11].address));
            const swapBal2 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);
            await expect(swapBal2).to.be.greaterThan(swapBal1);

            await uniswapV2Router.connect(signer[3]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount3 = Number(await provider.getBalance(signer[11].address));
            const swapBal3 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);
            await expect(swapBal3).to.be.greaterThan(swapBal2);

            await uniswapV2Router.connect(signer[4]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount4 = Number(await provider.getBalance(signer[11].address));
            const swapBal4 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);
            await expect(swapBal4).to.be.greaterThan(swapBal3);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquidityETH();
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount = Number(await provider.getBalance(signer[11].address));
            const swapBal = Number(await tokenA.balanceOf(signer[10].address));
            await expect(Number(await provider.getBalance(signer[11].address))).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapTokensForExactETH",async()=>{
          it("swap test", async function () {
            await _addLiquidityETH();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[0].address,1764541741);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("multiple account swap fees test", async function (){
            await _addLiquidityETH();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            const feeAmount = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal = (parseInt(await provider.getBalance(signer[10].address))/1e18);
            await uniswapV2Router.connect(signer[0]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[10].address,1764541741);
            await expect(Number(await tokenA.balanceOf(signer[11].address))).to.be.greaterThan(0);
            await expect(Number(await provider.getBalance(signer[10].address))).to.be.greaterThan(0);

            let tokenApproveAmount1 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount1[0]));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[10].address,1764541741);

            let tokenApproveAmount2 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[2]).approve(uniswapV2Router.address,Number(tokenApproveAmount2[0]));
            await uniswapV2Router.connect(signer[2]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[0].address,1764541741);

            let tokenApproveAmount3 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[3]).approve(uniswapV2Router.address,Number(tokenApproveAmount3[0]));
            await uniswapV2Router.connect(signer[3]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[0].address,1764541741);


            let tokenApproveAmount4 = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[4]).approve(uniswapV2Router.address,Number(tokenApproveAmount4[0]));
            await uniswapV2Router.connect(signer[4]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[0].address,1764541741);
            const feeAmount4 = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal4 = Number(await provider.getBalance(signer[10].address));
            await expect(feeAmount4).to.be.greaterThan(feeAmount);
            await expect(swapBal4).to.be.greaterThan(swapBal);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquidityETH();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[tokenA.address,weth.address]);
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            await uniswapV2Router.connect(signer[0]).swapTokensForExactETH(10001,tokenApproveAmount[0],[tokenA.address,weth.address],signer[10].address,1764541741);
            await expect(Number(await tokenA.balanceOf(signer[11].address))).to.be.greaterThan(0);
            await expect(Number(await provider.getBalance(signer[10].address))).to.be.greaterThan(0);
          });
        });
        describe("swapExactTokensForETH",async()=>{
          it("swapExactTokensForETH function", async function () {

            await _addLiquidityETH();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("multiple account swap fees test",async function(){
            await _addLiquidityETH();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            const feeAmount = Number(await tokenA.balanceOf(signer[11].address));
            const swapBal = Number(await provider.getBalance(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);
            await expect(Number(await tokenA.balanceOf(signer[11].address))).to.be.greaterThan(feeAmount);

            await tokenA.connect(signer[1]).approve(uniswapV2Router.address,amountInq);
            const feeAmount1 = Number(await tokenA.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[1]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);
            await expect(feeAmount1).to.be.greaterThan(feeAmount);

            await tokenA.connect(signer[2]).approve(uniswapV2Router.address,amountInq);
            const feeAmount2 = Number(await tokenA.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[2]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);

            await tokenA.connect(signer[3]).approve(uniswapV2Router.address,amountInq);
            const feeAmount3 = Number(await tokenA.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[3]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);

            await tokenA.connect(signer[4]).approve(uniswapV2Router.address,amountInq);
            const feeAmount4 = Number(await tokenA.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[4]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquidityETH();
            await tokenA.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETH(amountIn,1,[tokenA.address,weth.address],signer[0].address,1764541741);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapETHForExactTokens",async()=>{
          it("swap test", async function () {
            await _addLiquidityETH();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[weth.address,tokenA.address]);
            await uniswapV2Router.connect(signer[0]).swapETHForExactTokens(10001,[weth.address,tokenA.address],signer[0].address, 1764541741,{value:tokenApproveAmount[0]});

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);

          });
          it("multiple account swap fees test", async function (){
            await _addLiquidityETH();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(amountIn,[weth.address,tokenA.address]);
            const swapBal = Number(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapETHForExactTokens(amountIn,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:tokenApproveAmount[0]});
            const feeAmount = Number(await provider.getBalance(signer[11].address));
            await expect(Number(await tokenA.balanceOf(signer[10].address))).to.be.greaterThan(0);

            let tokenApproveAmount1 = await uniswapV2Router.getAmountsIn(amountIn,[weth.address,tokenA.address]);
            const swapBal1 = Number(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[1]).swapETHForExactTokens(amountIn,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:tokenApproveAmount1[0]});
            await expect(swapBal1).to.be.greaterThan(swapBal);

            let tokenApproveAmount2 = await uniswapV2Router.getAmountsIn(amountIn,[weth.address,tokenA.address]);
            const swapBal2 = Number(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[2]).swapETHForExactTokens(amountIn,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:tokenApproveAmount2[0]});
            await expect(swapBal2).to.be.greaterThan(swapBal1);

            let tokenApproveAmount3 = await uniswapV2Router.getAmountsIn(amountIn,[weth.address,tokenA.address]);
            const swapBal3 = Number(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[3]).swapETHForExactTokens(amountIn,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:tokenApproveAmount3[0]});
            await expect(swapBal3).to.be.greaterThan(swapBal2);

            let tokenApproveAmount4 = await uniswapV2Router.getAmountsIn(amountIn,[weth.address,tokenA.address]);
            const swapBal4 = Number(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[4]).swapETHForExactTokens(amountIn,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:tokenApproveAmount4[0]});
            const feeAmount1 = Number(await provider.getBalance(signer[11].address));
            await expect(swapBal4).to.be.greaterThan(swapBal3);
            await expect(feeAmount1).to.be.greaterThan(feeAmount);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after multiple swap",async function(){
            await _addLiquidityETH();

            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(amountIn,[weth.address,tokenA.address]);
            const beforeSwapBal = Number(await tokenA.balanceOf(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapETHForExactTokens(amountIn,[weth.address,tokenA.address],signer[10].address, 1764541741,{value:tokenApproveAmount[0]});
            const afterSwapBal = Number(await tokenA.balanceOf(signer[10].address));
            const feeAmount = Number(await provider.getBalance(signer[11].address));

            await expect(Number(await tokenA.balanceOf(signer[10].address))).to.be.greaterThan(0);
            await expect(afterSwapBal).to.be.greaterThan(beforeSwapBal);
            await expect(feeAmount).to.be.greaterThan(0);
          });
        });
        describe("swapExactTokensForTokensSupportingFeeOnTransferTokens",async()=>{
          it("swap test", async function () {
            await _addLiquiditytxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);

          });
          it("multiple account swap fees test", async function (){
            await _addLiquiditytxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal = Number(await tokenA.balanceOf(signer[10].address));
            await expect(Number(await taxableToken.balanceOf(signer[11].address))).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);
            
            await taxableToken.connect(signer[1]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[1]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount1 = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal1 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount1).to.be.greaterThan(feeAmount);
            await expect(swapBal1).to.be.greaterThan(swapBal);

            await taxableToken.connect(signer[2]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[2]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount2 = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal2 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);
            await expect(swapBal2).to.be.greaterThan(swapBal1);

            await taxableToken.connect(signer[2]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[2]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount3 = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal3 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);
            await expect(swapBal3).to.be.greaterThan(swapBal2);

            await taxableToken.connect(signer[3]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[3]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount4 = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal4 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);
            await expect(swapBal4).to.be.greaterThan(swapBal3);

            await taxableToken.connect(signer[4]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[4]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount5 = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal5 = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount5).to.be.greaterThan(feeAmount4);
            await expect(swapBal5).to.be.greaterThan(swapBal4);

            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquiditytxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            const feeAmount = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal = Number(await tokenA.balanceOf(signer[10].address));
            await expect(feeAmount).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);
          });
        });
        describe("swapExactETHForTokensSupportingFeeOnTransferTokens",async()=>{
          it("swap test", async function () {
            await _addLiquidityETHtxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,1000);
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[0].address, 1764541741,{value:amountIn});
            // console.log(await taxableToken.balanceOf(signer[11].address));

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("multiple account swap fees test", async function (){
            await _addLiquidityETHtxble();
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount = Number(await provider.getBalance(signer[11].address));
            const swapBal = Number(await taxableToken.balanceOf(signer[10].address));
            await expect(Number(await provider.getBalance(signer[11].address))).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);
            

            await uniswapV2Router.connect(signer[1]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount1 = Number(await provider.getBalance(signer[11].address));
            const swapBal1 = Number(await taxableToken.balanceOf(signer[10].address));
            await expect(feeAmount1).to.be.greaterThan(feeAmount);
            await expect(swapBal1).to.be.greaterThan(swapBal);

            await uniswapV2Router.connect(signer[2]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount2 = Number(await provider.getBalance(signer[11].address));
            const swapBal2 = Number(await taxableToken.balanceOf(signer[10].address));
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);
            await expect(swapBal2).to.be.greaterThan(swapBal1);

            await uniswapV2Router.connect(signer[3]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount3 = Number(await provider.getBalance(signer[11].address));
            const swapBal3 = Number(await taxableToken.balanceOf(signer[10].address));
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);
            await expect(swapBal3).to.be.greaterThan(swapBal2);

            await uniswapV2Router.connect(signer[4]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount4 = Number(await provider.getBalance(signer[11].address));
            const swapBal4 = Number(await taxableToken.balanceOf(signer[10].address));
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);
            await expect(swapBal4).to.be.greaterThan(swapBal3);

            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquidityETHtxble();
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[10].address, 1764541741,{value:amountIn});
            const feeAmount = Number(await provider.getBalance(signer[11].address));
            const swapBal = Number(await taxableToken.balanceOf(signer[10].address));
            await expect(Number(await provider.getBalance(signer[11].address))).to.be.greaterThan(0);
            await expect(swapBal).to.be.greaterThan(0);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        });
        describe("swapExactTokensForETHSupportingFeeOnTransferTokens",async()=>{
          it("swapExactTokensForETH function", async function () {

            await _addLiquidityETHtxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("multiple account swap fees test",async function(){
            await _addLiquidityETHtxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            const feeAmount = Number(await taxableToken.balanceOf(signer[11].address));
            const swapBal = Number(await provider.getBalance(signer[10].address));
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);
            await expect(Number(await taxableToken.balanceOf(signer[11].address))).to.be.greaterThan(feeAmount);

            await taxableToken.connect(signer[1]).approve(uniswapV2Router.address,amountInq);
            const feeAmount1 = Number(await taxableToken.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[1]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);
            await expect(feeAmount1).to.be.greaterThan(feeAmount);

            await taxableToken.connect(signer[2]).approve(uniswapV2Router.address,amountInq);
            const feeAmount2 = Number(await taxableToken.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[2]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);
            await expect(feeAmount2).to.be.greaterThan(feeAmount1);

            await taxableToken.connect(signer[3]).approve(uniswapV2Router.address,amountInq);
            const feeAmount3 = Number(await taxableToken.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[3]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);
            await expect(feeAmount3).to.be.greaterThan(feeAmount2);

            await taxableToken.connect(signer[4]).approve(uniswapV2Router.address,amountInq);
            const feeAmount4 = Number(await taxableToken.balanceOf(signer[11].address));
            await uniswapV2Router.connect(signer[4]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);
            await expect(feeAmount4).to.be.greaterThan(feeAmount3);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
          it("Fee collection after single swap",async function(){
            await _addLiquidityETHtxble();
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,amountInq);
            await uniswapV2Router.connect(signer[0]).swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn,1,[taxableToken.address,weth.address],signer[10].address,1764541741);

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        }); 
        describe("Tax Tokens Test Cases", async () => {
          it("swap swapExactTokensForTokens test", async function () {
            await _addLiquiditytxble();
            await taxableToken.connect(signer[1]).approve(uniswapV2Router.address,amountInq);
            let a = uniswapV2Router.connect(signer[1]).swapExactTokensForTokens(1000,1,[taxableToken.address,tokenA.address],signer[10].address, 1764541741);

            await expect(a).to.be.revertedWith("UniswapV2: K");
          });
          it("swap swapTokensForExactTokens test", async function () {
            await _addLiquiditytxble();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[taxableToken.address,tokenA.address]);
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            let a = uniswapV2Router.connect(signer[0]).swapTokensForExactTokens(10001,tokenApproveAmount[0],[taxableToken.address,tokenA.address],signer[10].address, 1764541741);
            
            await expect(a).to.be.revertedWith("UniswapV2: K");
          });

          it("swap swapExactETHForTokens test", async function () {
            await _addLiquidityETHtxble();
            await taxableToken.connect(signer[1]).approve(uniswapV2Router.address,amountIn);
            await uniswapV2Router.connect(signer[0]).swapExactETHForTokens(1,[weth.address,taxableToken.address],signer[0].address, 1764541741,{value:amountIn});
 
            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });

          it("swap swapTokensForExactETH test", async function () {
            await _addLiquidityETHtxble();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[taxableToken.address,weth.address]);
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            let a = uniswapV2Router.connect(signer[0]).swapTokensForExactETH(10001,tokenApproveAmount[0],[taxableToken.address,weth.address],signer[0].address,1764541741);
            
            await expect(a).to.be.revertedWith("UniswapV2: K");
          });
          it("swap swapExactTokensForETH test", async function () {
            await _addLiquidityETHtxble();
            
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[taxableToken.address,weth.address]);
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            let a = uniswapV2Router.connect(signer[0]).swapExactTokensForETH(tokenApproveAmount[0],1,[taxableToken.address,weth.address],signer[0].address,1764541741);

            await expect(a).to.be.revertedWith("UniswapV2: K");
          });
          it("swap swapETHForExactTokens test", async function () {
            await _addLiquidityETHtxble();
            let tokenApproveAmount = await uniswapV2Router.getAmountsIn(10001,[weth.address,taxableToken.address]);
            await taxableToken.connect(signer[0]).approve(uniswapV2Router.address,Number(tokenApproveAmount[0]));
            await uniswapV2Router.connect(signer[0]).swapETHForExactTokens(10001,[weth.address,taxableToken.address],signer[0].address, 1764541741,{value:tokenApproveAmount[0]});

            await expect(await tokenA.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await tokenB.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await taxableToken.balanceOf(uniswapV2Router.address)).to.equal(0);
            await expect(await provider.getBalance(uniswapV2Router.address)).to.equal(0);
          });
        })    
      });
    });
});

