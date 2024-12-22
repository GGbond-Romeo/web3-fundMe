// SPDX-License-Identifier: MIT

//provide compiler version
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**1.让合约收集资产
   2.记录投资人并且查看
   3.在锁定期内 达到目标值，生产商可以提款
   4.在锁定期内 没有达到目标值，投资人可以退款
**/


contract FundMe{

    mapping(address => uint256) public fundertoAmount;

    uint256 constant MINIUM_VALUE = 1 * 10 ** 18; //因为是wei做单位 这里代表1 USD

    uint256 constant TARGET = 1 * 10 **18;

    address public owner;

    address ERC20Addr;

    uint256 DeploymentTimeStamp;

    uint256 lockTime;

    bool public getFundSuccess = false;

    //如果以USD为单位 如何换算呢？引入预言机 把offchain 和onchain 链接起来
    AggregatorV3Interface internal dataFeed;

    //构造函数 获取最新的美元与ETH的价格关系的地址
    constructor(uint256 _lockTime) {
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );

        owner = msg.sender;

        DeploymentTimeStamp = block.timestamp; 
        lockTime = _lockTime;       
    }

    //获取最新的美元与ETH的价格关系
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
            (
                /* uint80 roundID */,
                int answer,
                /*uint startedAt*/,
                /*uint timeStamp*/,
                /*uint80 answeredInRound*/
            ) = dataFeed.latestRoundData();
            return answer;
    }

    function Fund() external payable {
        require(block.timestamp <= DeploymentTimeStamp + lockTime , "windows is closed");
        require(convertETHtoUSD(msg.value) >= MINIUM_VALUE,"need to send more ETH"); //不满足条件，就会返回字符串的内容
        
        fundertoAmount[msg.sender] = msg.value;
    }

    function convertETHtoUSD(uint256 ethAmount) internal view returns(uint256) {
        //(ETH amount) * (ETH price)  = (ETH value)
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return ethAmount * ethPrice / (10 ** 8);

    }

    function getFund() external windowClosed {
        require(convertETHtoUSD(address(this).balance) >= TARGET, "The fund is not reached");
        require(msg.sender == owner,"you are not the owner to get fund");

        bool success;
        //call函数 transfer ETH with data
        (success,) = payable(msg.sender).call{value: address(this).balance}("");
    //   (bool,result) = addr.call{value: }("")
        require(success, "transfer transaction is failed");
        fundertoAmount[msg.sender] = 0;

        getFundSuccess = true;


    }

    function returnFund() external windowClosed {
        require(convertETHtoUSD(address(this).balance) < TARGET, "Target is reached");

        require(fundertoAmount[msg.sender] != 0, "there is no fund for you");

        bool success;
        (success,) = payable(msg.sender).call{value: fundertoAmount[msg.sender]}("");
        require(success, "transfer transaction is failed");
        fundertoAmount[msg.sender] = 0;

    }

    function setFunderToAmount(address funder,uint256 amountToUpdate) external  {
        require(msg.sender == ERC20Addr, "you have no access to set");

        fundertoAmount[funder] = amountToUpdate;
    }

    function setErc20Addr(address _ERC20Addr) public onlyOwner {
        ERC20Addr = _ERC20Addr;
    }

    //如果想修改合约的owner,如何写呢？
    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    //modifyer概念 修饰function,复用代码更加简洁 可以提前进行判断减少计算节点 减少gas fee
    modifier windowClosed(){
        require(block.timestamp > DeploymentTimeStamp + lockTime , "windows time not arrive");
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "you are not the owner of this contract");
        _;
    }

}