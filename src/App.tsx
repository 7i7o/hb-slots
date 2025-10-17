import { HyperbeamUrlCard } from '@/components/HyperbeamUrlCard';
import { ProcessAdder } from '@/components/ProcessAdder';
import { SyncTable } from '@/components/SyncTable';
import { useHBStorage } from '@/hooks/useHBStorage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const {
    url,
    processes,
    saveUrl,
    addProcess,
    removeProcess,
    updateProcess,
  } = useHBStorage();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">HB Node Sync Monitor</h1>
          <p className="text-muted-foreground">
            Monitor sync status of processes across Hyperbeam nodes
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <HyperbeamUrlCard url={url} onUrlChange={saveUrl} />
          <ProcessAdder processes={processes} onAddProcess={addProcess} />
        </div>

        <SyncTable
          url={url}
          processes={processes}
          onRemoveProcess={removeProcess}
          onUpdateProcess={updateProcess}
        />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
