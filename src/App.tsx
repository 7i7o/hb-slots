import { useState, useEffect } from 'react';
import { SyncMonitor } from '@/pages/SyncMonitor';
import { BalanceChecker } from '@/pages/BalanceChecker';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Activity, Wallet } from 'lucide-react';

type Page = 'sync' | 'balance';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('sync');

  // Check URL params on mount to determine initial page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token') || params.has('wallet')) {
      setCurrentPage('balance');
    }
  }, []);

  // Update URL when switching pages (without page reload)
  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    // Clear URL params when switching to sync monitor
    if (page === 'sync') {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Button
              variant={currentPage === 'sync' ? 'default' : 'ghost'}
              onClick={() => handlePageChange('sync')}
              className="gap-2"
            >
              <Activity className="w-4 h-4" />
              Sync Monitor
            </Button>
            <Button
              variant={currentPage === 'balance' ? 'default' : 'ghost'}
              onClick={() => handlePageChange('balance')}
              className="gap-2"
            >
              <Wallet className="w-4 h-4" />
              Balance Checker
            </Button>
          </div>
        </div>
      </nav>

      {currentPage === 'sync' ? <SyncMonitor /> : <BalanceChecker />}
      
      <Toaster />
    </div>
  );
}

export default App;
