require("dotenv").config();
import { ethers, providers } from "ethers";
import { parse } from "csv-parse/sync";
import { readFile } from "fs/promises";
import * as ABI from "./abi.json";

const { NFT_ADDRESS, FILE_INPUT_PATH, PRIVATE_KEY, RPC_ENDPOINT, CALL_SIZE } =
  process.env;

const MULTI_SEND_CONTRACT_ADDRESS =
  "0x411df77a6d8bf55c950222f289073bcc3c248a76";
const provider = new providers.JsonRpcProvider(RPC_ENDPOINT);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(MULTI_SEND_CONTRACT_ADDRESS, ABI, wallet);
const callSize = parseInt(CALL_SIZE);
if (isNaN(callSize)) {
  throw new Error("CALL_SIZE should be number type");
}
//We only transfer 40 tokens per transaction
(async function () {
  console.log("Start transferring tokens ..... \n");
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
          await contract.estimateGas.batchTransferToMultiAddresses(
            NFT_ADDRESS,
            addresses,
            tokenIds
          )
        ).toHexString(),
        data: contract.interface.encodeFunctionData(
          "batchTransferToMultiAddresses",
          [NFT_ADDRESS, addresses, tokenIds]
        ),
      },
    });
  }
  await Promise.all(
    txParams.map(async (txParam) => {
      console.log(`Transferring ${txParam.size} tokens .... \n`);
      const tx = await wallet.sendTransaction(txParam.tx);
      console.log("Executed transaction ", tx, "\n");
    })
  );
})();
