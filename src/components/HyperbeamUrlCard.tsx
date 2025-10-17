import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface HyperbeamUrlCardProps {
  url: string;
  onUrlChange: (url: string) => void;
}

export function HyperbeamUrlCard({ url, onUrlChange }: HyperbeamUrlCardProps) {
  const [inputUrl, setInputUrl] = useState(url);

  const handleSave = () => {
    onUrlChange(inputUrl);
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Hyperbeam Node URL</h2>
          <p className="text-sm text-muted-foreground">
            Enter the base URL for your Hyperbeam node
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://your-hb-node.com"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleSave}
            disabled={!inputUrl.trim() || !isValidUrl(inputUrl)}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
        {url && (
          <div className="text-sm text-muted-foreground">
            Current: {url}
          </div>
        )}
      </div>
    </Card>
  );
}
