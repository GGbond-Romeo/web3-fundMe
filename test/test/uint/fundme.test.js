const { assert, expect } = require("chai")
const { ethers } = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../../helper-hardhat-config")

!developmentChains.includes(network.name) 
? describe.skip
: describe("test fundme contract", async function() {
    let fundMeDeploy,secondfundMeDepoly
    let firstAccount,secondAccount
    let MockV3Aggregator
    beforeEach(async function(){
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        
        const fundMeDeployment = await deployments.get("FundMe") //get Contract
        fundMeDeploy = await ethers.getContractAt("FundMe",fundMeDeployment.address)
        
        secondfundMeDepoly = await ethers.getContract("FundMe",secondAccount)

        MockV3Aggregator = await deployments.get("MockV3Aggregator")



    })

    it("test if the owner is msg.sender", async function(){
        //need to deploy before test
        await fundMeDeploy.waitForDeployment()
        assert.equal((await fundMeDeploy.owner()), firstAccount)
    })

    it("test if dataFeed is assigned correctly", async function(){
        //need to deploy before test
        await fundMeDeploy.waitForDeployment()

        assert.equal((await fundMeDeploy.dataFeed()), MockV3Aggregator.address)

    })

    // uint test for Fund
    //1.window open 2.value greater than min value 3.funder balance
    it("window closed,value greater than min value,fund failed",
        async function() {
            //make sure window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            //value greater than min value ,expect fail
            expect(fundMeDeploy.Fund({value: ethers.parseEther("0.1")}))
            .to.be.revertedWith("windows is closed")
    })

    it("window open,value less than min value,fund failed",
        async function() {
            //value less than min value ,expect fail
            expect(fundMeDeploy.Fund({value: ethers.parseEther("0.001")}))
            .to.be.revertedWith("you need more ETH!")
    })

    it("window open,value is greater than min value,fund success",
        async function() {
            //value greater than min value ,expect fail
            await fundMeDeploy.Fund({value: ethers.parseEther("0.1")})
            const balance = await fundMeDeploy.fundertoAmount(firstAccount)

            expect(balance).to.equal(ethers.parseEther("0.1"))

    })

    //unit test for getFund
    //onlyOwner,windowClose,target reached
    it("not owner,window close,target reached,getFund failed",
        async function(){

            await fundMeDeploy.Fund({value: ethers.parseEther("1")})
            await helpers.time.increase(200)
            await helpers.mine()

            expect(secondfundMeDepoly.getFund())
            .to.be.revertedWith("you are not owner")

            //expect(await fundMeDeploy.getFund())
            //.to.be.revertedWith("you are not owner")

    })

    it("window open, target reached, getFund failed",
        async function(){
            
            await fundMeDeploy.Fund({value: ethers.parseEther("1")})
            await expect(fundMeDeploy.getFund())
            .to.be.revertedWith("windows time not arrive")

    })

    it("window closed, target not reached, getFund failed",
        async function(){
        await fundMeDeploy.Fund({value: ethers.parseEther("0.1")})
        
        await helpers.time.increase(200)
        await helpers.mine()

        await expect(fundMeDeploy.getFund())
        .to.be.revertedWith("The fund is not reached")

    })

    it("window closed, target reached, getFund success",
        async function(){
        await fundMeDeploy.Fund({value: ethers.parseEther("1")})
        
        await helpers.time.increase(200)
        await helpers.mine()

        await expect(fundMeDeploy.getFund())
        .to.emit(fundMeDeploy,"FundWithdrawByOwner")
        .withArgs(ethers.parseEther("1"))

        }   
    )

    //unit test for refund
    //window closed, target not reached , funder has balance

    it("window open, target not reached, funder has balance",
        async function(){
            await fundMeDeploy.Fund({value: ethers.parseEther("0.1")})

            await expect(fundMeDeploy.returnFund())
            .to.be.revertedWith("windows time not arrive")
        
    })


    it("window closed, target not reach, funder dose not has balance",
        async function(){
            await fundMeDeploy.Fund({value: ethers.parseEther("0.1")})
            await helpers.time.increase(200)
            await helpers.mine()
            

            await expect(secondfundMeDepoly.returnFund())
            .to.be.revertedWith("there is no fund for you")

        }
    )

    it("window closed, target not reach, funder has balance",
        async function(){
            await fundMeDeploy.Fund({value: ethers.parseEther("0.1")})
            await helpers.time.increase(200)
            await helpers.mine()

            await expect(fundMeDeploy.returnFund())
            .to.emit(fundMeDeploy,"RefundByFunder")
            .withArgs(firstAccount, ethers.parseEther("0.1"))
        }
    )
    
})