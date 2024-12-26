const { assert, expect } = require("chai")
const { ethers } = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../../helper-hardhat-config")


developmentChains.includes(network.name) 
? describe.skip
: describe("test fundme contract", async function() {
    let fundMeDeploy
    let firstAccount
    beforeEach(async function(){
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        
        const fundMeDeployment = await deployments.get("FundMe") //get Contract
        fundMeDeploy = await ethers.getContractAt("FundMe",fundMeDeployment.address)

    })

    //test Fund and getFund successfully
    it("Fund and getFund successfully",
        async function(){
            //make sure target reached
            await fundMeDeploy.Fund({value: ethers.parseEther("1")})
            //make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))

            const getFundTx = await fundMeDeploy.getFund()
            const getFundReceipt = await getFundTx.await()

            expect(getFundReceipt)
                .to.be.emit(fundMe, "FundWithdrawByOwner")
                .withArgs(ethers.parseEther("1"))
        }
    )

    it("fund and refund successfully",
        async function(){
            //make sure target not reached
            await fundMeDeploy.Fund({value: ethers.parseEther("0.1")})
            //make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))

            const getreturnFundTx = await fundMeDeploy.returnFund()
            const getreturnFundReceipt = await getreturnFundTx.await()

            expect(getreturnFundReceipt)
                .to.be.emit(fundMe, "RefundByFunder")
                .withArgs(firstAccount, ethers.parseEther("0.1"))
        }
    )
    
    
})