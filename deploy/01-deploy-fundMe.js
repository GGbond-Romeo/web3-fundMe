// function deployFunction(){
//     console.log("this is a deploy function")
// }

const { network } = require("hardhat")
const { developmentChains, networkConfig, LOCK_TIME, CONFIRMATIONS} = require("../helper-hardhat-config")
// module.exports.default = deployFunction

// module.exports = async(hre) => {
//     const getNamedAccounts = hre.getNamedAccounts
//     const deployments = hre.deployments
//     console.log("this is a deploy function")
// }

module.exports = async({getNamedAccounts, deployments}) => {
    //const firstAccount = (await getNamedAccounts()).firstAccount
    const { firstAccount } = await getNamedAccounts()


    let dataFeedAddr
    let confirmations
    if ( developmentChains.includes(network.name) ){
        dataFeedAddr = (await deployments.get("MockV3Aggregator")).address
        confirmations = 0
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
        confirmations = CONFIRMATIONS
    }

    //const deploy = deployments().deploy
    const { deploy } = deployments
    const FundMeContract = await deploy("FundMe",{
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: confirmations
    })


    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: FundMeContract.address,
            constructorArguments: [LOCK_TIME, dataFeedAddr],
        });
    } else {
        console.log("verify skipped, bcz network is not sepolia")
    }


}


module.exports.tags = ["all","fundme"]