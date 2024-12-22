const { task } = require("hardhat/config")

task("getFund")
.addParam("addr","fundme contract address")
.setAction(async(taskArgs,hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    const fundMeDeploy = fundMeFactory.attach(taskArgs.addr)

    const TxGetFund = await fundMeDeploy.getFund()
    await TxGetFund.wait()

    const balanceOfContract = await ethers.provider.getBalance(taskArgs.addr) // or fundMeDeploy.target
    console.log(`currently,the contract balance is ${balanceOfContract}`)
})