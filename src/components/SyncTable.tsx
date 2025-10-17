import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcw, X } from 'lucide-react';
import type { Process } from '@/types';
import { ProcessRow } from './ProcessRow';
import { toast } from 'sonner';

interface SyncTableProps {
  url: string;
  processes: Process[];
  onRemoveProcess: (processId: string) => void;
  onUpdateProcess: (processId: string, updates: Partial<Process>) => void;
}

export function SyncTable({ url, processes, onRemoveProcess, onUpdateProcess }: SyncTableProps) {
  const fetchAllSlotData = async () => {
    if (!url) {
      toast.error('Please set a Hyperbeam URL first');
      return;
    }
    
    // Set all processes to loading state first
    processes.forEach(process => {
      onUpdateProcess(process.id, { loading: true });
    });

    // Fetch data for all processes in parallel using direct API calls
    const fetchPromises = processes.map(async (process) => {
      try {
        const targetUrl = `${url}/${process.id}~process@1.0/slot/current`;
        const syncedUrl = `${url}/${process.id}~process@1.0/compute/at-slot`;

        const [targetResponse, syncedResponse] = await Promise.allSettled([
          fetch(targetUrl),
          fetch(syncedUrl),
        ]);

        let targetSlot: number | null = null;
        let currentSlot: number | null = null;

        if (targetResponse.status === 'fulfilled' && targetResponse.value.ok) {
          const targetData = await targetResponse.value.json();
          targetSlot = targetData.slot || targetData;
        }

        if (syncedResponse.status === 'fulfilled' && syncedResponse.value.ok) {
          const syncedData = await syncedResponse.value.json();
          currentSlot = syncedData.slot || syncedData;
        }

        onUpdateProcess(process.id, {
          targetSlot,
          currentSlot,
          loading: false,
        });

        if (targetResponse.status === 'rejected' || syncedResponse.status === 'rejected') {
          console.warn(`Some data could not be fetched for ${process.id}`);
        }
      } catch (error) {
        onUpdateProcess(process.id, { loading: false });
        console.error(`Failed to fetch slot data for ${process.id}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    toast.success('Refreshed all processes');
  };

  const removeAllProcesses = () => {
    processes.forEach(process => onRemoveProcess(process.id));
  };

  if (processes.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No processes added yet. Add a process ID above to start monitoring.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Process Sync Status</h2>
            <p className="text-sm text-muted-foreground">
              Monitor sync status for your processes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchAllSlotData}
              disabled={processes.length === 0 || processes.some(p => p.loading) || !url}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={removeAllProcesses}
              disabled={processes.length === 0}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Process ID</TableHead>
              <TableHead className="text-center">Current Slot</TableHead>
              <TableHead className="text-center">Target Slot</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes.map((process) => (
              <ProcessRow
                key={process.id}
                process={process}
                url={url}
                onRemoveProcess={onRemoveProcess}
                onUpdateProcess={onUpdateProcess}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
