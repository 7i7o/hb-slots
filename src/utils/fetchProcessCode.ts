import type { EvalMessage, GraphQLResponse } from '@/types/codeDownloader';

const ARWEAVE_GRAPHQL_URL = 'https://arweave.net/graphql';
const ARWEAVE_GATEWAY_URL = 'https://arweave.net';

interface FetchProgressCallback {
  (current: number, total: number): void;
}

export async function fetchEvalMessages(
  processId: string,
  onProgress?: FetchProgressCallback
): Promise<EvalMessage[]> {
  const evalMessages: EvalMessage[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  // Fetch all eval message IDs from GraphQL
  while (hasNextPage) {
    const query = `
      query {
        transactions(
          first: 100
          ${cursor ? `after: "${cursor}"` : ''}
          recipients: ["${processId}"]
          tags: [
            { name: "Action", values: ["Eval"] }
          ]
        ) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              tags {
                name
                value
              }
              block {
                timestamp
              }
            }
          }
        }
      }
    `;

    const response = await fetch(ARWEAVE_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`);
    }

    const result: GraphQLResponse = await response.json();
    const edges = result.data.transactions.edges;
    hasNextPage = result.data.transactions.pageInfo.hasNextPage;

    if (edges.length > 0) {
      cursor = edges[edges.length - 1].cursor;

      // Fetch the actual code for each message
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const messageId = edge.node.id;
        const timestamp = edge.node.block?.timestamp || 0;

        try {
          // Fetch the actual message data
          const dataResponse = await fetch(`${ARWEAVE_GATEWAY_URL}/${messageId}`);
          if (dataResponse.ok) {
            const code = await dataResponse.text();
            evalMessages.push({ id: messageId, timestamp, code });
          }
        } catch (error) {
          console.error(`Failed to fetch message ${messageId}:`, error);
        }

        if (onProgress) {
          onProgress(evalMessages.length, evalMessages.length);
        }
      }
    } else {
      hasNextPage = false;
    }
  }

  // Sort by timestamp (chronological order)
  evalMessages.sort((a, b) => a.timestamp - b.timestamp);

  return evalMessages;
}

export function generateLuaFile(processId: string, messages: EvalMessage[]): string {
  const lines: string[] = [];

  lines.push(`-- AO Process Code Export`);
  lines.push(`-- Process ID: ${processId}`);
  lines.push(`-- Exported: ${new Date().toISOString()}`);
  lines.push(`-- Total Eval Messages: ${messages.length}`);
  lines.push('');
  lines.push('-- ' + '='.repeat(70));
  lines.push('');

  messages.forEach((msg, index) => {
    lines.push('');
    lines.push(`-- Message ${index + 1}/${messages.length}`);
    lines.push(`-- Message ID: ${msg.id}`);
    lines.push(`-- Link: https://ao.link/#/message/${msg.id}`);
    lines.push(`-- Timestamp: ${new Date(msg.timestamp * 1000).toISOString()}`);
    lines.push('-- ' + '-'.repeat(70));
    lines.push('');
    lines.push(msg.code);
    lines.push('');
  });

  return lines.join('\n');
}

export function downloadLuaFile(processId: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${processId}-code.lua`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
