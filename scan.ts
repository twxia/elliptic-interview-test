import {
  TokenBalancesResponse,
  TokenBalance,
  TokenMetadataResponse,
} from "alchemy-sdk";
import { ethers } from "ethers";
import fetch from "node-fetch";
import csv from "csv";
import fs from "fs";

const args = process.argv.slice(2);
const targetAddress = args[0];
const outputFileName = args[1] || "./out.csv";

type Erc20Record = {
  symbol: string;
  name: string;
  contractAddress: string;
  balance: string;
  decimals?: number;
};

type RpcResp<T> = {
  jsonrpc: string;
  id: number;
  result: T;
  pageKey?: string;
};

const rpcUrl =
  process.env.RPC_URL ||
  "https://eth-mainnet.g.alchemy.com/v2/Qj5WBinkHRx-qn-1O3IL1oitqaHiD_D4"; // demo purpose

(async () => {
  let pageKey: string | undefined = undefined;

  const tokens: TokenBalance[] = [];

  while (true) {
    const requestOptions = {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        headers: {
          "Content-Type": "application/json",
        },
        params: [
          `${targetAddress}`,
          "erc20",
          ...(!!pageKey ? [{ pageKey: pageKey }] : []),
        ],
        id: 42,
      }),
    };

    const result = await fetch(rpcUrl, requestOptions)
      .then((response) => response.json())
      .then(
        (json) => json as RpcResp<TokenBalancesResponse & { pageKey: string }>
      )
      .then((json) => json.result);

    tokens.push(
      ...result.tokenBalances.filter((token) => {
        return (
          token.tokenBalance !==
            "0x0000000000000000000000000000000000000000000000000000000000000000" ||
          token.error === null
        );
      })
    );

    if (!result.pageKey) {
      break;
    } else {
      pageKey = result.pageKey;
    }
  }

  console.log(`spotted ${tokens.length} erc20 tokens`);

  const data: Erc20Record[] = [];
  // Loop through all tokens with non-zero balance
  for (let token of tokens) {
    const requestOptions = {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenMetadata",
        headers: {
          "Content-Type": "application/json",
        },
        params: [`${token.contractAddress}`],
        id: 42,
      }),
    };
    const metadata = await fetch(rpcUrl, requestOptions)
      .then((response) => response.json())
      .then((json) => json as RpcResp<TokenMetadataResponse>)
      .then((json) => json.result || {});

    if (metadata.decimals && token.tokenBalance) {
      const balance = ethers.formatUnits(token.tokenBalance, metadata.decimals);
      // Print name, balance, and symbol of token

      data.push({
        symbol: metadata.symbol || "",
        name: metadata.name || "",
        contractAddress: token.contractAddress,
        balance: balance,
        decimals: metadata.decimals,
      });

      console.log(
        `${metadata.name} (${token.contractAddress}): ${balance} ${metadata.symbol}`
      );
    }
  }

  await csv.stringify(data, { header: true }, function (err, data) {
    fs.writeFileSync(outputFileName, data, "utf8");
    console.log("done!");
  });
})();
