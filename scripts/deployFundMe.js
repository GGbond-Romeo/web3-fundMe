//import ethers.js
//create main function
//execute main function

const { ethers } = require("hardhat")

async function main() {
    //create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying , pls wait a sec")
    //deploy contract from factory
    const fundMeDeploy = await fundMeFactory.deploy(180)  // deploy function can pass the argument of constructor
    await fundMeDeploy.waitForDeployment()
    console.log(`contract has been deploy successful,contract address is ${fundMeDeploy.target}`)

    //verify fundMe.sol
    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("waiting for 5 conformations")
        await fundMeDeploy.deploymentTransaction().wait(5)
        await verifyFundme(fundMeDeploy.target,[180])
    }else{
        console.log("verify skipped")
    }


    //interact contract 

    //1. init 2 account
    const[ firstAccount,secondAccount ] = await ethers.getSigners() //get value from hardhat.config.js

    //2. call fund function of Fundme with firstAccount
    const TxWithFirstAccount = await fundMeDeploy.Fund({value: ethers.parseEther("0.005")})
    await TxWithFirstAccount.wait()
    //3. view the balance of contract
    const balanceOfContract = ethers.provider.getBalance(fundMeDeploy.target)
    console.log(`current balance of Contract is ${balanceOfContract}`)

    //4. call fund function of Fundme with secondAccount
    const TxWithSecondAccount = await fundMeDeploy.connect(secondAccount).Fund({value: ethers.parseEther("0.005")})
    await TxWithSecondAccount.wait()

    const totalBalance = ethers.provider.getBalance(fundMeDeploy.target)
    console.log(`current balance of Contract is ${totalBalance}`)

    //5. view the fundertoAmount balance
    const balanceOfFirstAccountInFundMe = await fundMeDeploy.fundertoAmount(firstAccount.address)
    const balanceOfSecontAccountInFundMe = await fundMeDeploy.fundertoAmount(secondAccount.address)
    console.log(`firstAccount balance of Contract is ${balanceOfFirstAccountInFundMe}`)
    console.log(`secondAccount balance of Contract is ${balanceOfSecontAccountInFundMe}`)

}


async function verifyFundme(fundMeAddress,args) {
    await hre.run("verify:verify", {
        address: fundMeAddress,
        constructorArguments: args,
      });
}


main().then().catch( (error) => {
    console.error(error)
    process.exit(1)
})