const { task } = require("hardhat/config")

task("interact-fundme")
.addParam("addr","fundme contract address")
.setAction(async(taskArgs,hre) => {

    const fundMeFactory = await ethers.getContractFactory("FundMe")
    const fundMeDeploy = fundMeFactory.attach(taskArgs.addr)
//interact contract 

    //1. init 2 account
    const[ firstAccount,secondAccount ] = await ethers.getSigners() //get value from hardhat.config.js

    //2. call fund function of Fundme with firstAccount
    const TxWithFirstAccount = await fundMeDeploy.Fund({value: ethers.parseEther("0.005")})
    await TxWithFirstAccount.wait()
    //3. view the balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMeDeploy.target)
    console.log(`current balance of Contract is ${balanceOfContract}`)

    //4. call fund function of Fundme with secondAccount
    const TxWithSecondAccount = await fundMeDeploy.connect(secondAccount).Fund({value: ethers.parseEther("0.005")})
    await TxWithSecondAccount.wait()

    const totalBalance = await ethers.provider.getBalance(fundMeDeploy.target)
    console.log(`current balance of Contract is ${totalBalance}`)

    //5. view the fundertoAmount balance
    const balanceOfFirstAccountInFundMe = await fundMeDeploy.fundertoAmount(firstAccount.address)
    const balanceOfSecontAccountInFundMe = await fundMeDeploy.fundertoAmount(secondAccount.address)
    console.log(`firstAccount balance of Contract is ${balanceOfFirstAccountInFundMe}`)
    console.log(`secondAccount balance of Contract is ${balanceOfSecontAccountInFundMe}`)

})


module.exports = {}