const Web3 = require('web3')

// Web3 initialization (should point to the JSON-RPC endpoint)
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

const privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
const password = 'asd'

const V3KeyStore = web3.eth.accounts.encrypt(privateKey, password);
console.log(JSON.stringify(V3KeyStore));
process.exit();
