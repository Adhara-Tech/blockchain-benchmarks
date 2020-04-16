# Introduction
This repo aims to form a common suite of benchmarks/tests teams can run to be able to compare results. To this end, this repo uses Besu and Quorum examples to start similar blockchain networks and includes all the steps necessary to reproduce the results. 

## Test setup
The test setup for both Besu and Quorum networks are as follows:
- IBFT1 consensus for Quorum and IBFT2 consensus for Besu
- 4 Validator nodes
- 1 RPC node
- 1 Ethsigner, pointed at the RPC node
- 1 Deployed EIP20 contract, included under the `Tokens-master` folder
- 1 nodejs wrapper. This component wraps calls to the EIP20 contract and exposes an endpoint to perform an EIP20 transfer.
- 1 Jmeter and testplan.
- All the tests were run on a single PC with the following specs (ideally we would rerun on an AWS instance)
    - i7 8700k @ 4.7GHz
    - 32 GB RAM
    - 860 pro SSD

### Versions

- Besu: `1.4.4-SNAPSHOT`
- Quorum: `latest` tag on dockerhub, digest: sha256:ffa794d3fb0aa6d741ea721a665c3c61566e6d7e9e84a91b7f27a3e490163e5a
- Ethsigner: `0.6.1-SNAPSHOT`
- Jmeter: `5.2.1`
- ThroughputShapingTimer: `2.5`

## Getting started

To perform a benchmark, follow the setup for either Besu or Quorum. In order to switch from one blockchain network to another, shut the currently running one down (`./remove.sh` for Besu, `docker-compose down` for Quorum) starting the other one. When switching to a new blockchain network, section `Post blockchain network setup`'s steps 2, 3 and 4 need to be repeated, as well as restarting the Nodejs wrapper in step 7.

### Besu setup

1. Clone the Adhara-Tech Besu (forked from https://github.com/PegaSysEng/besu-sample-networks) sample networks: `git clone git@github.com:Adhara-Tech/besu-sample-networks.git`
2. cd to `besu-sample-networks` and start the sample network: `./run.sh -c ibft2`

### Quorum setup
1. Clone the Adhara-Tech Quorum (forked from https://github.com/jpmorganchase/quorum-examples) examples: `git clone git@github.com:Adhara-Tech/quorum-examples.git`
2. cd to `quorum-examples` and start the example network: `PRIVATE_CONFIG=ignore docker-compose up -d`

### Post blockchain network setup

1. Clone the Adhara-Tech blockchain-benchmarks repo, and cd into `blockchain-benchmarks` 
2. Deploy the ERC20 contract: `cd Tokens-master`, and run `truffle migrate --network withHDWallet --reset`
3. The contract address will be in the output, copy that value
4. Set the eip20Address in `blockchain-benchmarks/config.json`
5. Download and add ethsigner to PATH: `https://docs.ethsigner.pegasys.tech/en/stable/HowTo/Get-Started/Install-Binaries/`
6. Start ethsigner from the blockchain-benchmarks folder: `ethsigner --chain-id=44844 --downstream-http-host=127.0.0.1 --downstream-http-port=8545 --http-listen-port=6545 --downstream-http-request-timeout=30000 multikey-signer --directory="./keysAndPasswords"`
7. Start nodejs wrapper: `node index.js`
8. Download and install jmeter, also adding [https://jmeter-plugins.org/wiki/ThroughputShapingTimer/](https://jmeter-plugins.org/wiki/ThroughputShapingTimer/)

### Notes on the Nodejs wrapper

This component is a simple script that is needed to coordinate nonce increments, as well as simplifying interactions with smart contracts. For example, once it is running, one can browse to [http://localhost:9000/transferEIP20](http://localhost:9000/transferEIP20) to perform an EIP20 transfer. This component also (very roughly) spreads the load of checking txReceipts across multiple blockchain nodes. This is configured in `blockchain-benchmarks/config.json` using the 4 different rpcEndpoints. 

If nonce too low errors are encountered, restart the wrapper so that it can (automagically) sync the nonce to use from the blockchain.

### Notes on Jmeter
After downloading Jmeter, the GUI can be stared by doing `~/Downloads/apache-jmeter-5.2.1$ ./bin/jmeter.sh`

For accurate benchmarks, as well as generating a report at the end of a benchmark, use the following command:
`~/Downloads/apache-jmeter-5.2.1$ ./bin/jmeter -f -n -t ~/workspace/blockchain-benchmarks/TestPlan.jmx -l ~/workspace/blockchain-benchmarks/test_results/testResults.csv -e -o ~/workspace/blockchain-benchmarks/test_results/`
Just repace the location of the `blockchain-benchmarks` folder with the location of that folder on your machine.

Once the benchmark run is complete, by opening `blockchain-benchmarks/test_results/index.html` one can view the test results.

### Notes on the test plan

Included in this repo is the testplan used by Jmeter, it is located at `blockchain-benchmarks/TestPlan.jmx`. For short block times (1s) less threads (~1000) can be used (look for the `ThreadGroup.num_threads` setting), however for longer blocktimes more threads will need to be used.

In the `kg.apc.jmeter.timers.VariableThroughputTimer` section of the testplan the load profile can be set.

### Notes on Ethsigner

Ethsigner seems to be grabbing more ram with each transaction it signs, so after each benchmark run Ethsigner was restarted. Nothing conclusive yet, will investigate in the future.

## Test results

For the results presented here the number of threads were 1000 for 1s block times, and 250 requests per second were specified for a duration of 5 minutes. For the below tests, the block gas limit was kept at 50m, and block times were set to 1 and 5 seconds for separate runs. A couple of warmup runs were also performed before the results presented here were recorded.

Refer to the section titled "Notes on Jmeter" for generating and opening the reports.

### Besu
#### 1s block times
A sample Jmeter report can be found by looking at `test_results_besu_run3.tar.xz`. Looking at the sample report, hits (requests) and codes (responses) per second graphs show somewhat erratic responses, (after excluding the 3 initial and the last samples) the responses show lows of ~114 rps and highs of ~158 rps.

The below table summarises the results:    
```
				Requests	Executions			Response times (ms)								Throughput	Network (KB/sec)
#Run 	Description		Label		#Samples	KO	Error%	Average		Min	Max	90th pct	95th pct	99th pct	Transactions/s	Received	Sent
1. 	Besu 1s blocktime  	transfer	45442		0	0.00%	6480.60		2893	9870	6915.00		7124.00		7587.99		149.40		255.82		18.82
2.	Besu 1s blocktime	transfer	45085		0	0.00%	6580.03		2597	12435	7834.90		8603.00		10319.60	146.77		251.60		18.49
3.	Besu 1s blocktime	transfer	42736		0	0.00%	6957.49		2545	13988	6960.00		7075.00		7366.99		139.95		239.94		17.63
```

### Quorum
#### 1s block times
A sample Jmeter report can be found by looking at `test_results_quorum_run6.tar.xz`. Looking at the sample report, hits (requests) and codes (responses) per second graphs show resonably consistent responses, (after excluding the 3 initial and the last samples) the responses show lows of ~214 rps and highs of ~218 rps.

The below table summarises the results:
```
				Requests	Executions			Response times (ms)								Throughput	Network (KB/sec)
#Run 	Description		Label		#Samples	KO	Error%	Average		Min	Max	90th pct	95th pct	99th pct	Transactions/s	Received	Sent
4.	Quorum 1s blocktime	transfer	66739		0	0.00%	4498.78		3552	7342	4551.00		4595.00		4717.99		218.85		375.40		27.57
5.	Quorum 1s blocktime	transfer	64144		0	0.00%	4673.82		3086	5800	4763.00		4808.95		4909.99		210.52		361.29		26.52
6. 	Quorum 1s blocktime	transfer	65126		0	0.00%	4584.52		1540	5719	4729.00		4766.00		4902.99		213.78		366.87		26.93
```


### TODOs
.1 Look at the memory usage of ethsigner and identify if there is a leak or does it just grab more and more memory if available.    
.2 While testing the performance on a single system is interesting, generating the load on the same machine is not ideal. Rerunning the benchmarks where a separate machine is used to generate the load is a must.    
.3 Inspect metrics from Besu (prometheus metrics already present) as well as Quorum (would we need to add these metrics?), specifically blocktimes etc.
.4 Execute the same tests for longer blocktimes.
