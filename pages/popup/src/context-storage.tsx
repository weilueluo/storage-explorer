import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TreeNode, StorageType } from './storage';
import { getStorageContent, parseRecursive, checkPermission } from './storage';

export interface StorageStats {
  size: number; // kb
  timestamp: Date;
}

export interface UseStorageTree {
  tree: TreeNode | undefined;
  stats: StorageStats | undefined;
  error: string | undefined;
  reload: (storageType: StorageType, searchText: string, depth: number) => Promise<void>;
}

const StorageTreeContext = createContext<UseStorageTree>({
  tree: undefined,
  stats: undefined,
  error: undefined,
  reload: () => Promise.reject('storage context not initialized'),
});

export const StorageTreeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [tree, setTree] = useState<TreeNode | undefined>(undefined);
  const [stats, setStats] = useState<StorageStats | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const reload = useCallback(
    async (storageType: StorageType, searchText: string, depth: number) => {
      await getStorageContent(storageType)
        .then(storage => {
          const refreshTime = new Date();
          const parsed = parseRecursive(storage, depth, searchText);
          const blob = new Blob([parsed.clipboard_value], {
            type: 'application/json',
          });
          setStats({
            size: blob.size,
            timestamp: refreshTime,
          });
          console.log(parsed);
          setTree(parsed);
          setError(undefined);
        })
        .catch(err => setError(String(err)));
    },
    [setStats, setTree, setError],
  );

  useEffect(() => {
    checkPermission().catch(error => setError(String(error)));
  }, []);

  return <StorageTreeContext.Provider value={{ tree, stats, error, reload }}>{children}</StorageTreeContext.Provider>;
};

export const useStorageTree = (): UseStorageTree => {
  return useContext(StorageTreeContext);
};
