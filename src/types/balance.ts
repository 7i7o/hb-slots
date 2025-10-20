export interface TokenInfo {
  logo: string | null;
  ticker: string | null;
  name: string | null;
  denomination: number | null;
}

export interface BalanceResult {
  source: string;
  balance: string | null;
  tokenInfo: TokenInfo | null;
  loading: boolean;
  error: string | null;
}

export interface HBNode {
  id: string;
  url: string;
}

export interface CUNode {
  id: string;
  url: string;
}

export interface BalanceCheckerState {
  tokenProcessId: string;
  wallet: string;
  hbNodes: HBNode[];
  cuNodes: CUNode[];
}
