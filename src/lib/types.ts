export type Stablecoin = "USDT" | "USDC";

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
  defillamaId?: string;
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
  usdt: HistoryPoint[];
  usdc: HistoryPoint[];
}

export type TimeRange = "30d" | "90d" | "1y" | "all";
