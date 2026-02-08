import { ChainConfig } from "./types";

const RPC_TIMEOUT = 10_000;

function tronBase58ToHex(base58: string): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt(0);
  for (const char of base58) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 char: ${char}`);
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  const withoutChecksum = hex.slice(0, -8);
  const withoutPrefix = withoutChecksum.slice(2);
  return "0x" + withoutPrefix;
}

// --- EVM (Ethereum, Arbitrum, Avalanche, Base, Celo, Codex, HyperEVM, Ink, Linea, Monad, Optimism, Plume, Polygon, Sei, Sonic, Unichain, World Chain, XDC, ZKsync) ---
export async function fetchEvmSupply(chain: ChainConfig): Promise<number> {
  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        { to: chain.contractAddress, data: "0x18160ddd" },
        "latest",
      ],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const raw = BigInt(json.result);
  return Number(raw) / 10 ** chain.decimals;
}

// --- Tron ---
export async function fetchTronSupply(chain: ChainConfig): Promise<number> {
  const hexAddress = tronBase58ToHex(chain.contractAddress);
  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: hexAddress, data: "0x18160ddd" }, "latest"],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const raw = BigInt(json.result);
  return Number(raw) / 10 ** chain.decimals;
}

// --- Solana ---
export async function fetchSolanaSupply(chain: ChainConfig): Promise<number> {
  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenSupply",
      params: [chain.contractAddress],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result.value.uiAmount;
}

// --- TON ---
export async function fetchTonSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/v2/jettons/${chain.contractAddress}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  const totalSupply = BigInt(json.total_supply);
  return Number(totalSupply) / 10 ** chain.decimals;
}

// --- NEAR ---
export async function fetchNearSupply(chain: ChainConfig): Promise<number> {
  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: chain.contractAddress,
        method_name: "ft_total_supply",
        args_base64: "e30=",
      },
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const bytes = json.result.result as number[];
  const resultStr = String.fromCharCode(...bytes);
  const supplyStr = JSON.parse(resultStr) as string;
  return Number(BigInt(supplyStr)) / 10 ** chain.decimals;
}

// --- Stellar ---
export async function fetchStellarSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/assets?asset_code=USDC&asset_issuer=${chain.contractAddress}&limit=1`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!json._embedded?.records?.length) {
    throw new Error("No Stellar asset data found");
  }
  const record = json._embedded.records[0];
  return parseFloat(record.balances.authorized);
}

// --- Algorand (indexer API, circulating = total - reserve) ---
const ALGO_USDC_RESERVE = "2UEQTE5QDNXPI7M3TU44G6SYKLFWLPQO7EBZM7K7MHMQQMFI4QJPLHQFHM";

export async function fetchAlgorandSupply(chain: ChainConfig): Promise<number> {
  // Get reserve account's USDC balance
  const url = `${chain.rpcUrl}/v2/accounts/${ALGO_USDC_RESERVE}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!json.account) throw new Error("No Algorand account data found");
  const assetId = parseInt(chain.contractAddress);
  const assetHolding = json.account.assets?.find(
    (a: { "asset-id": number; amount: number }) => a["asset-id"] === assetId
  );
  if (!assetHolding) throw new Error("Reserve has no USDC holding");
  const total = BigInt("18446744073709551615"); // max uint64
  const reserveBalance = BigInt(assetHolding.amount);
  const circulating = total - reserveBalance;
  return Number(circulating) / 10 ** chain.decimals;
}

// --- Aptos (fungible_asset::supply view function) ---
// USDT uses a package address; must resolve metadata first via usdt::usdt_address()
// USDC uses the metadata object address directly
const APTOS_METADATA_CACHE: Record<string, string> = {};

async function resolveAptosMetadata(rpcUrl: string, contractAddress: string): Promise<string> {
  if (APTOS_METADATA_CACHE[contractAddress]) return APTOS_METADATA_CACHE[contractAddress];

  // Check if address is already a metadata object (has Metadata resource)
  const checkUrl = `${rpcUrl}/accounts/${contractAddress}/resource/0x1::fungible_asset::Metadata`;
  const checkRes = await fetch(checkUrl, { signal: AbortSignal.timeout(RPC_TIMEOUT) });
  if (checkRes.ok) {
    APTOS_METADATA_CACHE[contractAddress] = contractAddress;
    return contractAddress;
  }

  // Try to resolve via module's address function (e.g. usdt::usdt_address)
  const modules = ["usdt", "usdc"];
  for (const mod of modules) {
    try {
      const res = await fetch(`${rpcUrl}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          function: `${contractAddress}::${mod}::${mod}_address`,
          type_arguments: [],
          arguments: [],
        }),
        signal: AbortSignal.timeout(RPC_TIMEOUT),
      });
      const json = await res.json();
      if (Array.isArray(json) && json[0]) {
        APTOS_METADATA_CACHE[contractAddress] = json[0];
        return json[0];
      }
    } catch {
      // try next module
    }
  }
  throw new Error("Cannot resolve Aptos metadata address");
}

export async function fetchAptosSupply(chain: ChainConfig): Promise<number> {
  const metadataAddr = await resolveAptosMetadata(chain.rpcUrl, chain.contractAddress);
  const url = `${chain.rpcUrl}/view`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      function: "0x1::fungible_asset::supply",
      type_arguments: ["0x1::fungible_asset::Metadata"],
      arguments: [metadataAddr],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error_code) throw new Error(json.message || "Aptos view error");
  const optionVal = json[0];
  if (optionVal?.vec?.length > 0) {
    return Number(BigInt(optionVal.vec[0])) / 10 ** chain.decimals;
  }
  throw new Error("No supply data from Aptos");
}

// --- Hedera (mirror node REST) ---
export async function fetchHederaSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/api/v1/tokens/${chain.contractAddress}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!json.total_supply) throw new Error("No Hedera token data found");
  const decimals = parseInt(json.decimals) || chain.decimals;
  return Number(BigInt(json.total_supply)) / 10 ** decimals;
}

// --- Noble / Cosmos (LCD REST, by_denom endpoint) ---
export async function fetchNobleSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/cosmos/bank/v1beta1/supply/by_denom?denom=${chain.contractAddress}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!json.amount?.amount) throw new Error("No Noble supply data found");
  return Number(BigInt(json.amount.amount)) / 10 ** chain.decimals;
}

// --- Polkadot Asset Hub (Parity Sidecar REST API) ---
export async function fetchPolkadotSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/pallets/assets/storage/Asset?keys[]=${chain.contractAddress}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!json.value?.supply) throw new Error("No Polkadot asset supply data");
  return Number(BigInt(json.value.supply)) / 10 ** chain.decimals;
}

// --- Starknet (starknet_getStorageAt for total_supply) ---
export async function fetchStarknetSupply(chain: ChainConfig): Promise<number> {
  // Storage key for total_supply (low u128) = sn_keccak("ERC20_total_supply")
  // Bridged USDC: 0x110e2f729c9c2b988559994a3daccd838cf52faf88e18101373e67dd061455a
  // Native USDC:  0x1557182e4359a1f0c6301278e8f5b35a776ab58d39892581e357578fb287836
  const STORAGE_KEYS: Record<string, string> = {
    "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8":
      "0x110e2f729c9c2b988559994a3daccd838cf52faf88e18101373e67dd061455a",
    "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb":
      "0x1557182e4359a1f0c6301278e8f5b35a776ab58d39892581e357578fb287836",
  };
  const key = STORAGE_KEYS[chain.contractAddress.toLowerCase()];
  if (!key) throw new Error("Unknown Starknet USDC contract");

  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "starknet_getStorageAt",
      params: {
        contract_address: chain.contractAddress,
        key,
        block_id: "latest",
      },
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "Starknet RPC error");
  // Result is the low u128 of the u256 supply (high is 0 for practical values)
  const supply = BigInt(json.result);
  return Number(supply) / 10 ** chain.decimals;
}

// --- Sui (JSON-RPC suix_getTotalSupply) ---
export async function fetchSuiSupply(chain: ChainConfig): Promise<number> {
  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getTotalSupply",
      params: [chain.contractAddress],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return Number(BigInt(json.result.value)) / 10 ** chain.decimals;
}

// --- XRPL (JSON-RPC gateway_balances) ---
export async function fetchXrplSupply(chain: ChainConfig): Promise<number> {
  const res = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "gateway_balances",
      params: [
        {
          account: chain.contractAddress,
          hotwallet: [],
          ledger_index: "validated",
        },
      ],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  const result = json.result;
  if (result.error) throw new Error(result.error_message || result.error);
  const obligations = result.obligations;
  if (!obligations) throw new Error("No XRPL obligations data");
  // USDC hex currency code: 5553444300000000000000000000000000000000
  const usdcHex = "5553444300000000000000000000000000000000";
  const amount = obligations[usdcHex] || obligations["USDC"];
  if (!amount) throw new Error("No USDC obligations found on XRPL");
  return parseFloat(amount);
}

// --- Liquid Network (Blockstream API) ---
export async function fetchLiquidSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/asset/${chain.contractAddress}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!json.chain_stats) throw new Error("No Liquid asset data found");
  const issued = BigInt(json.chain_stats.issued_amount);
  const burned = BigInt(json.chain_stats.burned_amount);
  return Number(issued - burned) / 10 ** chain.decimals;
}

// --- Tezos (TzKT API) ---
export async function fetchTezosSupply(chain: ChainConfig): Promise<number> {
  const url = `${chain.rpcUrl}/v1/tokens?contract=${chain.contractAddress}&tokenId=0&limit=1`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(RPC_TIMEOUT),
  });
  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error("No Tezos token data found");
  }
  const totalSupply = json[0].totalSupply;
  if (!totalSupply) throw new Error("No totalSupply in Tezos token");
  return Number(BigInt(totalSupply)) / 10 ** chain.decimals;
}

// --- Router ---
export async function fetchSupply(chain: ChainConfig): Promise<number> {
  switch (chain.chainType) {
    case "evm":
      return fetchEvmSupply(chain);
    case "tron":
      return fetchTronSupply(chain);
    case "solana":
      return fetchSolanaSupply(chain);
    case "ton":
      return fetchTonSupply(chain);
    case "near":
      return fetchNearSupply(chain);
    case "stellar":
      return fetchStellarSupply(chain);
    case "algorand":
      return fetchAlgorandSupply(chain);
    case "aptos":
      return fetchAptosSupply(chain);
    case "hedera":
      return fetchHederaSupply(chain);
    case "noble":
      return fetchNobleSupply(chain);
    case "polkadot":
      return fetchPolkadotSupply(chain);
    case "starknet":
      return fetchStarknetSupply(chain);
    case "sui":
      return fetchSuiSupply(chain);
    case "xrpl":
      return fetchXrplSupply(chain);
    case "liquid":
      return fetchLiquidSupply(chain);
    case "tezos":
      return fetchTezosSupply(chain);
    default:
      throw new Error(`Unknown chain type: ${chain.chainType}`);
  }
}
