import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { RefreshCw, Trash2 } from 'lucide-react';
import type { Process } from '@/types';
import { toast } from 'sonner';

interface ProcessRowProps {
  process: Process;
  url: string;
  onRemoveProcess: (processId: string) => void;
  onUpdateProcess: (processId: string, updates: Partial<Process>) => void;
}

export function ProcessRow({ process, url, onRemoveProcess, onUpdateProcess }: ProcessRowProps) {
  const fetchSlotData = async () => {
    if (!url) {
      toast.error('Please set a Hyperbeam URL first');
      return;
    }

    onUpdateProcess(process.id, { loading: true });

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
        toast.warning(`Some data could not be fetched for ${process.id}`);
      }
    } catch (error) {
      onUpdateProcess(process.id, { loading: false });
      toast.error(`Failed to fetch slot data for ${process.id}`);
      console.error('Fetch error:', error);
    }
  };

  const getSyncStatus = () => {
    if (process.loading) return 'Loading...';
    if (process.targetSlot === null || process.currentSlot === null) return 'No data';
    if (process.currentSlot === process.targetSlot) return '✅ Synced';
    return '⚠️ Behind';
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-sm text-center">{process.id}</TableCell>
      <TableCell className="text-center">
        {process.loading ? '...' : process.currentSlot ?? 'N/A'}
      </TableCell>
      <TableCell className="text-center">
        {process.loading ? '...' : process.targetSlot ?? 'N/A'}
      </TableCell>
      <TableCell className="text-center">{getSyncStatus()}</TableCell>
      <TableCell className="text-center">
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSlotData}
            disabled={process.loading || !url}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemoveProcess(process.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
