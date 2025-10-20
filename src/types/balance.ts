export interface BalanceResult {
  source: string;
  balance: string | null;
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
