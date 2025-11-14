import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchEvalMessages, generateLuaFile, downloadLuaFile } from '@/utils/fetchProcessCode';

export function CodeDownloader() {
  const [processId, setProcessId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleDownload = async () => {
    if (!processId.trim()) {
      toast.error('Please enter a process ID');
      return;
    }

    setIsLoading(true);
    setProgress({ current: 0, total: 0 });

    try {
      toast.info('Fetching eval messages...');

      const messages = await fetchEvalMessages(processId, (current, total) => {
        setProgress({ current, total });
      });

      if (messages.length === 0) {
        toast.warning('No eval messages found for this process');
        return;
      }

      toast.info(`Found ${messages.length} eval messages. Generating file...`);

      const luaContent = generateLuaFile(processId, messages);
      downloadLuaFile(processId, luaContent);

      toast.success(`Successfully downloaded code for ${messages.length} eval messages!`);
    } catch (error) {
      console.error('Failed to download code:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download code');
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">AO Process Code Downloader</h1>
          <p className="text-muted-foreground">
            Download all eval messages for an AO process as a single Lua file
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Process Information</h2>
              <p className="text-sm text-muted-foreground">
                Enter the AO process ID to download its code
              </p>
            </div>

            <div className="flex gap-4">
              <Input
                placeholder="Enter process ID (e.g., n2DbyGJVMMyZuDt8zDTS5QCfo4j1TRRsCEU9oj0uJ8M)"
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDownload()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleDownload}
                disabled={!processId.trim() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </Button>
            </div>

            {isLoading && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Fetching messages...</span>
                  <span>{progress.current} messages</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">About</h2>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This tool fetches all <code className="px-1 py-0.5 bg-secondary rounded">Eval</code> messages 
                sent to an AO process and compiles them into a single Lua file.
              </p>
              <p>
                Each eval message will be included in chronological order with:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Message ID and link to ao.link</li>
                <li>Timestamp</li>
                <li>The actual Lua code</li>
              </ul>
              <p>
                Perfect for backing up your process code or understanding how a process was built over time.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
