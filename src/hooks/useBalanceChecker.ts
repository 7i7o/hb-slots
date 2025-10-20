import { useState, useEffect } from 'react';
import type { HBNode, CUNode } from '@/types/balance';

const STORAGE_KEY_TOKEN = 'balance-checker-token';
const STORAGE_KEY_WALLET = 'balance-checker-wallet';
const STORAGE_KEY_HB_NODES = 'balance-checker-hb-nodes';
const STORAGE_KEY_CU_NODES = 'balance-checker-cu-nodes';

const DEFAULT_CU = 'https://cu.ao-testnet.xyz';

export function useBalanceChecker() {
  const [tokenProcessId, setTokenProcessId] = useState<string>('');
  const [wallet, setWallet] = useState<string>('');
  const [hbNodes, setHbNodes] = useState<HBNode[]>([]);
  const [cuNodes, setCuNodes] = useState<CUNode[]>([]);

  // Load from URL params or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const urlToken = params.get('token');
    const urlWallet = params.get('wallet');
    const urlHbNodes = params.get('hbNodes');
    const urlCuNodes = params.get('cuNodes');

    // Load from URL params if available, otherwise from localStorage
    if (urlToken) {
      setTokenProcessId(urlToken);
    } else {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (savedToken) setTokenProcessId(savedToken);
    }

    if (urlWallet) {
      setWallet(urlWallet);
    } else {
      const savedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
      if (savedWallet) setWallet(savedWallet);
    }

    if (urlHbNodes) {
      try {
        const nodes = urlHbNodes.split(',').map((url, index) => ({
          id: `hb-${Date.now()}-${index}`,
          url: url.trim()
        }));
        setHbNodes(nodes);
      } catch (error) {
        console.error('Failed to parse HB nodes from URL:', error);
      }
    } else {
      const savedHbNodes = localStorage.getItem(STORAGE_KEY_HB_NODES);
      if (savedHbNodes) {
        try {
          setHbNodes(JSON.parse(savedHbNodes));
        } catch (error) {
          console.error('Failed to parse saved HB nodes:', error);
        }
      }
    }

    if (urlCuNodes) {
      try {
        const nodes = urlCuNodes.split(',').map((url, index) => ({
          id: `cu-${Date.now()}-${index}`,
          url: url.trim()
        }));
        setCuNodes(nodes);
      } catch (error) {
        console.error('Failed to parse CU nodes from URL:', error);
      }
    } else {
      const savedCuNodes = localStorage.getItem(STORAGE_KEY_CU_NODES);
      if (savedCuNodes) {
        try {
          setCuNodes(JSON.parse(savedCuNodes));
        } catch (error) {
          console.error('Failed to parse saved CU nodes:', error);
        }
      } else {
        // Add default CU if none exist
        setCuNodes([{ id: `cu-${Date.now()}`, url: DEFAULT_CU }]);
      }
    }
  }, []);

  const saveTokenProcessId = (token: string) => {
    setTokenProcessId(token);
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  };

  const saveWallet = (walletAddress: string) => {
    setWallet(walletAddress);
    localStorage.setItem(STORAGE_KEY_WALLET, walletAddress);
  };

  const addHbNode = (url: string) => {
    setHbNodes(prevNodes => {
      const newNode: HBNode = { id: `hb-${Date.now()}`, url };
      const updatedNodes = [...prevNodes, newNode];
      localStorage.setItem(STORAGE_KEY_HB_NODES, JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const removeHbNode = (id: string) => {
    setHbNodes(prevNodes => {
      const updatedNodes = prevNodes.filter(n => n.id !== id);
      localStorage.setItem(STORAGE_KEY_HB_NODES, JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const addCuNode = (url: string) => {
    setCuNodes(prevNodes => {
      const newNode: CUNode = { id: `cu-${Date.now()}`, url };
      const updatedNodes = [...prevNodes, newNode];
      localStorage.setItem(STORAGE_KEY_CU_NODES, JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const removeCuNode = (id: string) => {
    setCuNodes(prevNodes => {
      const updatedNodes = prevNodes.filter(n => n.id !== id);
      localStorage.setItem(STORAGE_KEY_CU_NODES, JSON.stringify(updatedNodes));
      return updatedNodes;
    });
  };

  const getShareableUrl = () => {
    const params = new URLSearchParams();
    if (tokenProcessId) params.set('token', tokenProcessId);
    if (wallet) params.set('wallet', wallet);
    if (hbNodes.length > 0) {
      params.set('hbNodes', hbNodes.map(n => n.url).join(','));
    }
    if (cuNodes.length > 0) {
      params.set('cuNodes', cuNodes.map(n => n.url).join(','));
    }
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  return {
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
  };
}
