import { BalanceInputs } from '@/components/BalanceInputs';
import { NodeManager } from '@/components/NodeManager';
import { BalanceResults } from '@/components/BalanceResults';
import { useBalanceChecker } from '@/hooks/useBalanceChecker';

export function BalanceChecker() {
  const {
    tokenProcessId,
    wallet,
    hbNodes,
    cuNodes,
    saveTokenProcessId,
    saveWallet,
    addHbNode,
    removeHbNode,
    addCuNode,
    removeCuNode,
    getShareableUrl,
  } = useBalanceChecker();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Token Balance Checker</h1>
          <p className="text-muted-foreground">
            Compare token balances across Hyperbeam nodes and Compute Units
          </p>
        </div>

        <BalanceInputs
          tokenProcessId={tokenProcessId}
          wallet={wallet}
          onTokenChange={saveTokenProcessId}
          onWalletChange={saveWallet}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <NodeManager
            title="HB Nodes"
            description="Add Hyperbeam node URLs to check balances"
            nodes={hbNodes}
            onAddNode={addHbNode}
            onRemoveNode={removeHbNode}
            placeholder="https://your-hb-node.com"
          />
          <NodeManager
            title="Compute Units"
            description="Add CU URLs to check balances via dryrun"
            nodes={cuNodes}
            onAddNode={addCuNode}
            onRemoveNode={removeCuNode}
            placeholder="https://cu.ao-testnet.xyz"
          />
        </div>

        <BalanceResults
          tokenProcessId={tokenProcessId}
          wallet={wallet}
          hbNodes={hbNodes}
          cuNodes={cuNodes}
          getShareableUrl={getShareableUrl}
        />
      </div>
    </div>
  );
}
