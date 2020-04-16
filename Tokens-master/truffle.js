const HDWalletProvider = require('truffle-hdwallet-provider')
const fs = require('fs')

// First read in the secrets.json to get our mnemonic
let secrets
let mnemonic
if (fs.existsSync('secrets.json')) {
  secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'))
  mnemonic = secrets.mnemonic
} else {
  console.log('No secrets.json found. If you are trying to publish EPM ' +
              'this will fail. Otherwise, you can ignore this message!')
  mnemonic = ''
}

module.exports = {
  networks: {
    live: {
      network_id: 1 // Ethereum public network
      // optional config values
      // host - defaults to "localhost"
      // port - defaults to 8545
      // gas
      // gasPrice
      // from - default address to use for any transaction Truffle makes during migrations
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io'),
      network_id: '3'
    },
    testrpc: {
      network_id: 'default'
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    withHDWallet: {
      host: 'localhost',
      //	host: "127.0.0.1",
      port: 8545,
      gas: '50000000',
      gasPrice: 0,
      network_id: '*',
      from: 'fe3b557e8fb62b89f4916b721be55ceb828dbd73',
      provider: () => new HDWalletProvider('8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', 'http://localhost:8545'),
    }
  }
}
