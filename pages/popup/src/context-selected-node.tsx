import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { TreeNode } from './storage';
import { varName } from './utils';

export interface SelectedTreeData {
  selectedTree: TreeNode | undefined;
  setSelected: (tree: TreeNode | undefined) => void;
  selectedPath: TreeNode[];
  selectedIds: Set<number>;
}

const SelectedTreeContext = createContext<SelectedTreeData>({
  selectedTree: undefined,
  setSelected: () => {
    throw new Error(`${varName(SelectedTreeContext)} not initialized`);
  },
  selectedPath: [],
  selectedIds: new Set(),
});

export const SelectedTreeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [selectedTree, setSelected] = useState<TreeNode | undefined>();
  const [selectedPath, setSelectedPath] = useState<TreeNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (selectedTree !== undefined) {
      const newPathNodes = [];
      const newPathIds = new Set<number>();
      let head = selectedTree;
      while (head && head.parent != undefined) {
        // skip root, it is a dummy holder to the user
        newPathNodes.push(head);
        newPathIds.add(head.meta.id);
        head = head.parent;
      }
      setSelectedPath(newPathNodes.reverse());
      setSelectedIds(newPathIds);
    }
  }, [selectedTree, setSelectedPath, setSelectedIds]);

  return (
    <SelectedTreeContext.Provider
      value={{
        selectedTree,
        setSelected,
        selectedPath,
        selectedIds,
      }}>
      {children}
    </SelectedTreeContext.Provider>
  );
};

export const useSelectedTree = (): SelectedTreeData => {
  return useContext(SelectedTreeContext);
};
