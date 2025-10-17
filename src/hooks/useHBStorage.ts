import { useState, useEffect } from 'react';
import type { Process } from '@/types';

const STORAGE_KEY_URL = 'hb-slots-url';
const STORAGE_KEY_PROCESSES = 'hb-slots-processes';

export function useHBStorage() {
  const [url, setUrl] = useState<string>('');
  const [processes, setProcesses] = useState<Process[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const savedProcesses = localStorage.getItem(STORAGE_KEY_PROCESSES);

    if (savedUrl) {
      setUrl(savedUrl);
    }
    if (savedProcesses) {
      try {
        const parsed = JSON.parse(savedProcesses);
        setProcesses(parsed.map((p: any) => ({
          ...p,
          currentSlot: null,
          targetSlot: null,
          loading: false
        })));
      } catch (error) {
        console.error('Failed to parse saved processes:', error);
      }
    }
  }, []);

  // Save URL to localStorage
  const saveUrl = (newUrl: string) => {
    setUrl(newUrl);
    localStorage.setItem(STORAGE_KEY_URL, newUrl);
  };


  // Add a new process
  const addProcess = (processId: string) => {
    const newProcess: Process = {
      id: processId,
      currentSlot: null,
      targetSlot: null,
      loading: false
    };
    setProcesses(prevProcesses => {
      const updatedProcesses = [...prevProcesses, newProcess];
      localStorage.setItem(STORAGE_KEY_PROCESSES, JSON.stringify(updatedProcesses));
      return updatedProcesses;
    });
  };

  // Remove a process
  const removeProcess = (processId: string) => {
    setProcesses(prevProcesses => {
      const updatedProcesses = prevProcesses.filter(p => p.id !== processId);
      localStorage.setItem(STORAGE_KEY_PROCESSES, JSON.stringify(updatedProcesses));
      return updatedProcesses;
    });
  };

  // Update process slots (race-condition safe)
  const updateProcess = (processId: string, updates: Partial<Process>) => {
    setProcesses(prevProcesses =>
      prevProcesses.map(p =>
        p.id === processId ? { ...p, ...updates } : p
      )
    );
  };

  return {
    url,
    processes,
    saveUrl,
    addProcess,
    removeProcess,
    updateProcess,
  };
}
