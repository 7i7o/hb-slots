import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { HBNode, CUNode } from '@/types/balance';

interface NodeManagerProps {
  title: string;
  description: string;
  nodes: (HBNode | CUNode)[];
  onAddNode: (url: string) => void;
  onRemoveNode: (id: string) => void;
  placeholder?: string;
}

export function NodeManager({ 
  title, 
  description, 
  nodes, 
  onAddNode, 
  onRemoveNode,
  placeholder = "Enter node URL"
}: NodeManagerProps) {
  const [nodeUrl, setNodeUrl] = useState('');

  const handleAdd = () => {
    if (!nodeUrl.trim()) return;
    
    const exists = nodes.some(n => n.url === nodeUrl);
    if (exists) return;

    onAddNode(nodeUrl);
    setNodeUrl('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const nodeExists = nodes.some(n => n.url === nodeUrl);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={nodeUrl}
            onChange={(e) => setNodeUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleAdd}
            disabled={!nodeUrl.trim() || nodeExists}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {nodeExists && (
          <div className="text-sm text-destructive">
            This URL already exists
          </div>
        )}
        {nodes.length > 0 && (
          <div className="space-y-2">
            {nodes.map((node) => (
              <div 
                key={node.id} 
                className="flex items-center justify-between px-3 py-1 rounded-lg border bg-card"
              >
                <span className="text-sm font-mono truncate flex-1">{node.url}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveNode(node.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
