const Web3 = require('web3')
const express = require('express')
const contract = require('@truffle/contract')

let config = require('./config.json')
const web3Signer = new Web3(new Web3.providers.HttpProvider(config.ethSignerEndpoint))
const web3Rpc1 = new Web3(new Web3.providers.HttpProvider(config.rpcEndpoint1))
const web3Rpc2 = new Web3(new Web3.providers.HttpProvider(config.rpcEndpoint2))
const web3Rpc3 = new Web3(new Web3.providers.HttpProvider(config.rpcEndpoint3))
const web3Rpc4 = new Web3(new Web3.providers.HttpProvider(config.rpcEndpoint4))
const eip20ContractJson = require('./contract_artifacts/build/contracts/EIP20.json')
const app = express()

let intNonce = 0

function sleep(ms){
  return new Promise(async function(resolve, reject){
    setTimeout(function(cb){
      resolve()
    }, ms)
  })
}

let rpcQuery = 0
function getTransactionReceipt(txHash){
  return new Promise(async function(resolve, reject){
    try{
      const startTime = Date.now()
      let txReceipt = await web3Rpc1.eth.getTransactionReceipt(txHash)
      while(!txReceipt && startTime + config.timeToWaitForTransactionReceipt > Date.now()){
        await sleep(config.timeBetweenTransactionReceiptPolls)
        // Very rough round robin
        rpcQuery++
        if(rpcQuery % 4 === 0){
          txReceipt = await web3Rpc1.eth.getTransactionReceipt(txHash)
        } else if(rpcQuery % 3 === 0){
          txReceipt = await web3Rpc2.eth.getTransactionReceipt(txHash)
        } else if(rpcQuery % 2 === 0){
          txReceipt = await web3Rpc3.eth.getTransactionReceipt(txHash)
        } else {
          txReceipt = await web3Rpc4.eth.getTransactionReceipt(txHash)
        }
      }
      if(!txReceipt){
        return reject(Error('Transaction receipt for '+txHash+' is null after '+config.timeToWaitForTransactionReceipt+'ms'))
      }
      if(txReceipt.status === false){
        return reject(Error('Transaction receipt\'s status for '+txHash+' is false'))
      }
      resolve(txReceipt)
    } catch (error){
      reject(Error('getTransactionReceipt: '+error))
    }
  })
}

function sendTransaction(txObject){
  return new Promise(function(resolve, reject){
    web3Signer.eth.sendTransaction(txObject, function(error, txHash){
      if(error){
        reject(Error('sendTransaction: '+error))
      } else {
        resolve(txHash)
      }
    })
  })
}

async function transferEIP20(eip20){
  const amount = 1
  const txData = await eip20.contract.methods.transfer(config.toAccountAddress, amount).encodeABI()

  const txObject = {
    from: config.fromAccountAddress,
    to: config.eip20Address,
    value: '0x0',
    gasPrice: '0x0',
    gas: '0xDAC0',
    nonce: '0x'+(++intNonce).toString(16),
    data: txData
  }
  const txHash = await sendTransaction(txObject)
  const txReceipt = await getTransactionReceipt(txHash)
  return txReceipt
}

async function transferEth(){
  const amount = 1

  const txObject = {
    from: config.fromAccountAddress,
    to: config.toAccountAddress,
    value: '0x0',
    gasPrice: '0x0',
    gas: '0x5210',
    nonce: '0x'+(++intNonce).toString(16),
    data: '0x0'
  }
  const txHash = await sendTransaction(txObject)
  const txReceipt = await getTransactionReceipt(txHash)
  return txReceipt
}

async function main(){
  if(process.argv.length > 2){
    config = require(process.argv[2])
  }

  let eip20 = null
  if(config.eip20Address.length > 0){
    const EIP20Contract = contract(eip20ContractJson)
    EIP20Contract.setProvider(new Web3.providers.HttpProvider(config.ethSignerEndpoint))
    eip20 = await EIP20Contract.at(config.eip20Address)
  }

  intNonce = await web3Rpc1.eth.getTransactionCount(config.fromAccountAddress) -1

  app.get('/isUp', function(req, res){
    res.status(200).send({
      "isUp":"true"
    })
  })

  app.get('/transferEIP20', async function(req, res){
    try{
      const txReceipt = await transferEIP20(eip20)
      res.status(200).send(txReceipt)
    } catch (error){
      console.log('/transferEIP20:', error)
      res.status(500).send('/transferEIP20: ' + error)
    }
  })

  app.get('/transferEth', async function(req, res){
    try{
      const txReceipt = await transferEth()
      res.status(200).send(txReceipt)
    } catch (error){
      console.log('/transferEth:', error)
      res.status(500).send('/transferEth: ' + error)
    }
  })

  app.listen(config.serverPort, function(){
    console.log('Registered routes:')
    console.log('/isUp')
    console.log('/transferEIP20')
    console.log('/transferEth')
    console.log()
    console.log(`Server running on ${config.serverPort}`)
  })

}

main()
