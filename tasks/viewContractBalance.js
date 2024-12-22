const { task } = require("hardhat/config")

task("viewContractBalance")
.addParam("addr","fundme contract address")
.setAction(async(taskArgs,hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    const fundMeDeploy = fundMeFactory.attach(taskArgs.addr)

    const totalBalance = await ethers.provider.getBalance(fundMeDeploy.target)
    console.log(`current balance of Contract is ${totalBalance}`)
})