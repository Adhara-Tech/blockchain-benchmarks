const EIP20 = artifacts.require('./EIP20.sol');

module.exports = (deployer) => {
  deployer.deploy(EIP20, 100000000000, 'Simon Bucks', 1, 'SBX');
};
