const SimpleStorage = artifacts.require("SimpleStorage");
const GasLessToken = artifacts.require("GasLessToken");
const QuoteContract = artifacts.require("QuoteContract");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
    deployer.deploy(QuoteContract);
    let totalSupply = "10000000000000000000000000000";
    let owner = "0x256144a60f34288F7b03D345F8Cb256C502e0f2C";
  
    deployer.deploy(GasLessToken, "Gasless Token", "BCNMY", totalSupply, owner);
  };
