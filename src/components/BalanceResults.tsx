import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Share2 } from 'lucide-react';
import type { HBNode, CUNode, BalanceResult } from '@/types/balance';
import { toast } from 'sonner';
import { connect } from '@permaweb/aoconnect';

interface BalanceResultsProps {
  tokenProcessId: string;
  wallet: string;
  hbNodes: HBNode[];
  cuNodes: CUNode[];
  getShareableUrl: () => string;
}

export function BalanceResults({ 
  tokenProcessId, 
  wallet, 
  hbNodes, 
  cuNodes,
  getShareableUrl 
}: BalanceResultsProps) {
  const [results, setResults] = useState<BalanceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = async () => {
    if (!tokenProcessId || !wallet) {
      toast.error('Please set token and wallet first');
      return;
    }

    if (hbNodes.length === 0 && cuNodes.length === 0) {
      toast.error('Please add at least one HB node or CU');
      return;
    }

    setIsLoading(true);

    // Initialize results with loading state
    const initialResults: BalanceResult[] = [
      ...hbNodes.map(node => ({
        source: `HB: ${node.url}`,
        balance: null,
        loading: true,
        error: null
      })),
      ...cuNodes.map(node => ({
        source: `CU: ${node.url}`,
        balance: null,
        loading: true,
        error: null
      }))
    ];

    setResults(initialResults);

    // Fetch from HB nodes
    const hbPromises = hbNodes.map(async (node, index) => {
      try {
        const url = `${node.url}/${tokenProcessId}~process@1.0/compute/balances/${wallet}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const balance = data.balance || data;

        setResults(prev => {
          const newResults = [...prev];
          newResults[index] = {
            source: `HB: ${node.url}`,
            balance: String(balance),
            loading: false,
            error: null
          };
          return newResults;
        });
      } catch (error) {
        setResults(prev => {
          const newResults = [...prev];
          newResults[index] = {
            source: `HB: ${node.url}`,
            balance: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch'
          };
          return newResults;
        });
      }
    });

    // Fetch from CU nodes
    const cuPromises = cuNodes.map(async (node, index) => {
      try {
        const { dryrun } = connect({ MODE: 'legacy', CU_URL: node.url });
        
        const result = await dryrun({
          process: tokenProcessId,
          tags: [
            { name: 'Action', value: 'Balance' },
            { name: 'Recipient', value: wallet }
          ],
        });

        let balance = 'N/A';
        
        // Try to extract balance from response
        if (result.Messages && result.Messages.length > 0) {
          const balanceTag = result.Messages[0].Tags?.find((tag: any) => 
            tag.name === 'Balance' || tag.name === 'balance'
          );
          if (balanceTag) {
            balance = balanceTag.value;
          } else if (result.Messages[0].Data) {
            balance = result.Messages[0].Data;
          }
        }

        setResults(prev => {
          const newResults = [...prev];
          newResults[hbNodes.length + index] = {
            source: `CU: ${node.url}`,
            balance,
            loading: false,
            error: null
          };
          return newResults;
        });
      } catch (error) {
        setResults(prev => {
          const newResults = [...prev];
          newResults[hbNodes.length + index] = {
            source: `CU: ${node.url}`,
            balance: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch'
          };
          return newResults;
        });
      }
    });

    await Promise.all([...hbPromises, ...cuPromises]);
    setIsLoading(false);
    toast.success('Balances fetched');
  };

  const handleShare = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    toast.success('Shareable URL copied to clipboard!');
  };

  const canFetch = tokenProcessId && wallet && (hbNodes.length > 0 || cuNodes.length > 0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Balance Results</h2>
            <p className="text-sm text-muted-foreground">
              Compare balances across different sources
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              disabled={!canFetch}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={fetchBalances}
              disabled={!canFetch || isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Configure settings above and click refresh to check balances
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Source</TableHead>
                <TableHead className="text-center">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm text-center">
                    {result.source}
                  </TableCell>
                  <TableCell className="text-center">
                    {result.loading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : result.error ? (
                      <span className="text-destructive">{result.error}</span>
                    ) : (
                      <span className="font-mono">{result.balance}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
