# ERC721 Multi send

![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)

This repo provides a script to transfer multiple ERC721 tokens to multiple accounts.
The smart contract that does this can be viewed [here](https://bscscan.com/address/0x411df77a6d8bf55c950222f289073bcc3c248a76#code).

## Getting Started
### Installation
Requires [Node.js](https://nodejs.org/) v14+ to run.

Install the dependencies and devDependencies and start the server.

```sh
npm i -g yarn
npm i -g typescript
yarn
```
### Set up the Environment
You need to set up your development environment before you can do anything.

#### .env
```sh
npm i -g yarn
yarn
```

[RPC endpoints available](https://docs.binance.org/smart-chain/developer/rpc.html)
```dosini
NFT_ADDRESS (The address of ERC721 token)
PRIVATE_KEY (Your private key that owns the token)
RPC_ENDPOINT (RPC endpoint where you can send transactions 
FILE_INPUT_PATH (Your csv file path)
CALL_SIZE (The number of tokens you want to transfer in a transaction. We will split into multiple transactions if the number of tokens is too large to avoid gas overflow. Recommend less than 50)
```
#### example.csv
```dosini
address,tokenId
0x....,0
0x....,1
0x....,2
........
```

### Run
After filling in all the environment variables, run the command:
```sh
yarn start
```

