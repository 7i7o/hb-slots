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
import type { HBNode, CUNode, BalanceResult, TokenInfo } from '@/types/balance';
import { toast } from 'sonner';
import { connect } from '@permaweb/aoconnect';

// Format balance with proper decimals
function formatBalance(balance: string | null, denomination: number | null): string {
  if (!balance || balance === 'N/A') return balance || 'N/A';
  if (!denomination) return balance;
  
  try {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    
    const divisor = Math.pow(10, denomination);
    const formatted = (num / divisor).toString();
    return formatted;
  } catch {
    return balance;
  }
}

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
        tokenInfo: null,
        loading: true,
        error: null
      })),
      ...cuNodes.map(node => ({
        source: `CU: ${node.url}`,
        balance: null,
        tokenInfo: null,
        loading: true,
        error: null
      }))
    ];

    setResults(initialResults);

    // Fetch from HB nodes
    const hbPromises = hbNodes.map(async (node, index) => {
      try {
        const baseUrl = `${node.url}/${tokenProcessId}~process@1.0/compute`;
        
        // Fetch balance and token info in parallel
        const [balanceResponse, tokenInfoResponse] = await Promise.allSettled([
          fetch(`${baseUrl}/balances/${wallet}`),
          fetch(`${baseUrl}/token-info?require-codec=application/json&accept-bundle=true`)
        ]);

        let balance = null;
        const tokenInfo: TokenInfo = {
          logo: null,
          ticker: null,
          name: null,
          denomination: null
        };

        if (balanceResponse.status === 'fulfilled' && balanceResponse.value.ok) {
          const data = await balanceResponse.value.json();
          balance = String(data.balance || data);
        }

        if (tokenInfoResponse.status === 'fulfilled' && tokenInfoResponse.value.ok) {
          const response = await tokenInfoResponse.value.json();
          
          // Token info is nested inside 'body' property
          const info = response.body || response;
          
          // Logo is an Arweave TX ID, prepend the gateway URL
          if (info.logo || info.Logo) {
            const logoTxId = info.logo || info.Logo;
            tokenInfo.logo = `https://arweave.net/${logoTxId}`;
          }
          
          tokenInfo.ticker = info.ticker || info.Ticker || null;
          tokenInfo.name = info.name || info.Name || null;
          
          const denom = info.denomination || info.Denomination;
          tokenInfo.denomination = denom ? parseInt(String(denom)) : null;
        }

        setResults(prev => {
          const newResults = [...prev];
          newResults[index] = {
            source: `HB: ${node.url}`,
            balance,
            tokenInfo,
            loading: false,
            error: balanceResponse.status === 'rejected' ? 'Failed to fetch balance' : null
          };
          return newResults;
        });
      } catch (error) {
        setResults(prev => {
          const newResults = [...prev];
          newResults[index] = {
            source: `HB: ${node.url}`,
            balance: null,
            tokenInfo: null,
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
        
        // Fetch balance and token info in parallel
        const [balanceResult, infoResult] = await Promise.allSettled([
          dryrun({
            process: tokenProcessId,
            tags: [
              { name: 'Action', value: 'Balance' },
              { name: 'Recipient', value: wallet }
            ],
          }),
          dryrun({
            process: tokenProcessId,
            tags: [
              { name: 'Action', value: 'Info' }
            ],
          })
        ]);

        let balance: string | null = null;
        const tokenInfo: TokenInfo = {
          logo: null,
          ticker: null,
          name: null,
          denomination: null
        };
        
        // Extract balance from response
        if (balanceResult.status === 'fulfilled') {
          const result = balanceResult.value;
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
        }

        // Extract token info from response
        if (infoResult.status === 'fulfilled') {
          const result = infoResult.value;
          if (result.Messages && result.Messages.length > 0) {
            const tags = result.Messages[0].Tags || [];
            
            const logoTag = tags.find((tag: any) => tag.name === 'Logo');
            if (logoTag) {
              // Logo is an Arweave TX ID, prepend the gateway URL
              tokenInfo.logo = `https://arweave.net/${logoTag.value}`;
            }
            
            const tickerTag = tags.find((tag: any) => tag.name === 'Ticker');
            if (tickerTag) tokenInfo.ticker = tickerTag.value;
            
            const nameTag = tags.find((tag: any) => tag.name === 'Name');
            if (nameTag) tokenInfo.name = nameTag.value;
            
            const denomTag = tags.find((tag: any) => tag.name === 'Denomination');
            if (denomTag) tokenInfo.denomination = parseInt(denomTag.value) || null;
          }
        }

        setResults(prev => {
          const newResults = [...prev];
          newResults[hbNodes.length + index] = {
            source: `CU: ${node.url}`,
            balance,
            tokenInfo,
            loading: false,
            error: balanceResult.status === 'rejected' ? 'Failed to fetch balance' : null
          };
          return newResults;
        });
      } catch (error) {
        setResults(prev => {
          const newResults = [...prev];
          newResults[hbNodes.length + index] = {
            source: `CU: ${node.url}`,
            balance: null,
            tokenInfo: null,
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
                <TableHead className="text-center">Token</TableHead>
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
                      <span className="font-mono">
                        {formatBalance(result.balance, result.tokenInfo?.denomination || null)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {result.loading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : result.tokenInfo ? (
                      <div className="flex items-center justify-center gap-2">
                        {result.tokenInfo.logo && (
                          <img 
                            src={result.tokenInfo.logo} 
                            alt={result.tokenInfo.ticker || 'Token'} 
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {result.tokenInfo.ticker && (
                          <span className="font-semibold">{result.tokenInfo.ticker}</span>
                        )}
                        {!result.tokenInfo.logo && !result.tokenInfo.ticker && (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
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
