import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Process } from '@/types';

interface ProcessAdderProps {
  processes: Process[];
  onAddProcess: (processId: string) => void;
}

export function ProcessAdder({ processes, onAddProcess }: ProcessAdderProps) {
  const [processId, setProcessId] = useState('');

  const handleAdd = () => {
    if (!processId.trim()) return;
    
    const exists = processes.some(p => p.id === processId);
    if (exists) return;

    onAddProcess(processId);
    setProcessId('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const processExists = processes.some(p => p.id === processId);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add Process</h2>
          <p className="text-sm text-muted-foreground">
            Enter a process ID to monitor its sync status
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter process ID"
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleAdd}
            disabled={!processId.trim() || processExists}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {processExists && (
          <div className="text-sm text-destructive">
            Process ID already exists
          </div>
        )}
      </div>
    </Card>
  );
}
