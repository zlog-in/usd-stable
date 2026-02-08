export type Stablecoin = "USDT" | "USDC" | "DAI" | "PYUSD" | "FDUSD" | "GHO" | "USDe";

export interface StablecoinMeta {
  symbol: Stablecoin;
  name: string;
  color: string;
  coingeckoId: string;
  defillamaName: string;
}

export interface ChainConfig {
  id: string;
  name: string;
  token: Stablecoin;
  contractAddress: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  explorerAddressPath: string;
  chainType:
    | "evm"
    | "tron"
    | "solana"
    | "ton"
    | "near"
    | "stellar"
    | "algorand"
    | "aptos"
    | "hedera"
    | "noble"
    | "polkadot"
    | "starknet"
    | "sui"
    | "xrpl"
    | "liquid"
    | "tezos";
  color: string;
}

export interface ChainSupply {
  chainId: string;
  chainName: string;
  token: Stablecoin;
  supply: number | null;
  error?: string;
  color: string;
  contractAddress: string;
  explorerUrl: string;
  explorerAddressPath: string;
}

export interface SupplyResponse {
  data: ChainSupply[];
  timestamp: number;
}

export interface HistoryPoint {
  date: string;
  timestamp: number;
  totalSupply: number;
}

export interface HistoryResponse {
  [symbol: string]: HistoryPoint[];
}

export type TimeRange = "30d" | "90d" | "1y" | "all";

export interface PegData {
  symbol: string;
  price: number;
  change24h: number;
}

export interface PegResponse {
  data: PegData[];
  timestamp: number;
}

export interface ChainSharePoint {
  date: string;
  [chain: string]: number | string;
}

export interface ChainDetailResponse {
  chainShares: ChainSharePoint[];
  changes: Record<string, { change24h: number | null; change7d: number | null }>;
}
