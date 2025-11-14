export interface EvalMessage {
  id: string;
  timestamp: number;
  code: string;
}

export interface GraphQLEdge {
  cursor: string;
  node: {
    id: string;
    tags: Array<{ name: string; value: string }>;
    block?: {
      timestamp: number;
    };
  };
}

export interface GraphQLResponse {
  data: {
    transactions: {
      edges: GraphQLEdge[];
      pageInfo: {
        hasNextPage: boolean;
      };
    };
  };
}
