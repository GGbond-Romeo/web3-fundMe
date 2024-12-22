const { task } = require("hardhat/config")

task("deploy-fundme").setAction(async(taskArgs,hre) => {
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

async function verifyFundme(fundMeAddress,args) {
    await hre.run("verify:verify", {
        address: fundMeAddress,
        constructorArguments: args,
     });
    }

})

module.exports = {}