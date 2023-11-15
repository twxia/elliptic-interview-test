# scan erc20 tokens

This script uses Alchemy's custom RPC endpoint, [alchemy_getTokenBalances](https://docs.alchemy.com/reference/alchemy-gettokenbalances), to fetch all erc20 tokens of an address.

```
npm install # install dependencies

npx tsx ./scan.ts # scan a address's erc20 tokens

# e.g. npx tsx ./scan.ts 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 # scan vitalik's erc20 tokens
```
