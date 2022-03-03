require("dotenv").config();
import { ethers, providers } from "ethers";
import { parse } from "csv-parse/sync";
import { readFile } from "fs/promises";
import * as MultiSendABI from "./multiSend.json";
import * as ERC721ABI from "./erc721.json";


const { NFT_ADDRESS, FILE_INPUT_PATH, PRIVATE_KEY, RPC_ENDPOINT, CALL_SIZE } =
  process.env;

const MULTI_SEND_CONTRACT_ADDRESS =
  "0x411df77a6d8bf55c950222f289073bcc3c248a76";
const provider = new providers.JsonRpcProvider(RPC_ENDPOINT);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const nftContract = new ethers.Contract(NFT_ADDRESS, ERC721ABI, wallet);
const multiSendContract = new ethers.Contract(MULTI_SEND_CONTRACT_ADDRESS, MultiSendABI, wallet);
const callSize = parseInt(CALL_SIZE);
if (isNaN(callSize)) {
  throw new Error("CALL_SIZE should be number type");
}

//Before starting to transfer tokens, we need you to approve all your tokens for multi contract
async function preTransfer() {
  const approved = await nftContract.isApprovedForAll(wallet.address, MULTI_SEND_CONTRACT_ADDRESS);
  if (!approved) {
    const tx = await nftContract.setApprovalForAll(MULTI_SEND_CONTRACT_ADDRESS, true);
    console.log("Execute approve transaction", tx);
  } 
  console.log("Approved all tokens for", MULTI_SEND_CONTRACT_ADDRESS)
}

(async function () {
  console.log("Start transferring tokens .....");
  await preTransfer();
  //Read data from csv file
  const fileData = await readFile(FILE_INPUT_PATH, {
    encoding: "utf8",
  });
  const txParams = [];
  const records = parse(fileData, {
    columns: true,
    skip_empty_lines: true,
  });

  const length: number = records?.length ?? 0;
  let i = 0;
  let currentNonce = await wallet.getTransactionCount();
  const gasPrice = await wallet.getGasPrice();
  while (i < Math.ceil(length / callSize)) {
    //We will split transactions to send tokens, each transaction will send `CALL_SIZE` tokens
    const slice = records.slice(i * callSize, (i + 1) * callSize);
    i++;
    const addresses = [];
    const tokenIds = [];
    slice.forEach((item) => {
      addresses.push(item?.address);
      tokenIds.push(item?.tokenId);
    });
    txParams.push({
      size: slice.length,
      tx: {
        from: wallet.address,
        to: MULTI_SEND_CONTRACT_ADDRESS,
        value: "0x",
        nonce: "0x" + (currentNonce++).toString(16),
        gasPrice: gasPrice.toHexString(),
        gasLimit: (
          await multiSendContract.estimateGas.batchTransferToMultiAddresses(
            NFT_ADDRESS,
            addresses,
            tokenIds
          )
        ).toHexString(),
        data: multiSendContract.interface.encodeFunctionData(
          "batchTransferToMultiAddresses",
          [NFT_ADDRESS, addresses, tokenIds]
        ),
      },
    });
  }
  await Promise.all(
    txParams.map(async (txParam) => {
      console.log(`Transferring ${txParam.size} tokens ....`);
      const tx = await wallet.sendTransaction(txParam.tx);
      console.log("Executed transaction ", tx);
    })
  );
})();
