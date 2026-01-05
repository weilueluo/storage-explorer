import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { TreeNode } from './storage';
import { useStorageTree } from './context-storage';
import { useSelectedTree } from './context-selected-node';
import { getPathFromLeaf, getRecursive } from './bookmark-utils';
import { triggerClearSearch } from './hooks';
import { varName } from './utils';

export interface SpotlightData {
  spotlightTrigger: number;
  spotlight: (node: TreeNode) => void;
  resetSpotlight: () => void;
}

const SpotlightContext = createContext<SpotlightData>({
  spotlightTrigger: 0,
  spotlight: () => {
    throw new Error(`${varName(SpotlightContext)} not initialized`);
  },
  resetSpotlight: () => {},
});

export const SpotlightProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [spotlightTrigger, setSpotlightTrigger] = useState<number>(0);
  const [pendingPath, setPendingPath] = useState<string[] | null>(null);

  const { tree } = useStorageTree();
  const { setSelected } = useSelectedTree();

  // Track previous tree reference to detect reloads
  const prevTreeRef = useRef<TreeNode | undefined>(undefined);

  // Internal function to apply spotlight immediately
  const spotlightImmediate = useCallback(
    (node: TreeNode) => {
      setSelected(node);
      setSpotlightTrigger(prev => prev + 1);
    },
    [setSelected],
  );

  // Main spotlight function - handles both search and non-search scenarios
  const spotlight = useCallback(
    (node: TreeNode) => {
      // Compute key path before clearing search (node refs become stale after reload)
      const pathKeys = getPathFromLeaf(node).map(n => n.key);
      setPendingPath(pathKeys);

      // Clear search - returns true if search was active
      const searchWasActive = triggerClearSearch();

      if (!searchWasActive) {
        // No search to clear means tree won't reload
        // Apply spotlight immediately
        setPendingPath(null);
        spotlightImmediate(node);
      }
      // If search was active, tree will reload and useEffect below will handle pending path
    },
    [spotlightImmediate],
  );

  // Handle pending spotlight when tree reloads
  useEffect(() => {
    // Only process if tree actually changed (reloaded)
    if (tree && pendingPath && pendingPath.length > 0 && tree !== prevTreeRef.current) {
      setPendingPath(null);

      // Find node by path in new tree
      for (const child of Object.values(tree.children)) {
        const foundNode = getRecursive(child, pendingPath);
        if (foundNode) {
          spotlightImmediate(foundNode);
          break;
        }
      }
    }
    prevTreeRef.current = tree;
  }, [tree, pendingPath, spotlightImmediate]);

  const resetSpotlight = useCallback(() => {
    setSpotlightTrigger(0);
    setPendingPath(null);
  }, []);

  return (
    <SpotlightContext.Provider
      value={{
        spotlightTrigger,
        spotlight,
        resetSpotlight,
      }}>
      {children}
    </SpotlightContext.Provider>
  );
};

export const useSpotlight = (): SpotlightData => {
  return useContext(SpotlightContext);
};
