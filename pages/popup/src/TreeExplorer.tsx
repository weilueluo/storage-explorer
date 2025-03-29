import React, { useEffect, useState } from 'react';
import { FaAnglesDown, FaAnglesUp } from 'react-icons/fa6';
import LoadingComponent from './loading';
import { TreeNode } from './storage';
import { Tree } from './TreeNode';
import { m } from './utils';
import { useStorageTree } from './context-storage';
import { useSelectedTree } from './context-selected-node';
import { useBookmarks } from './context-bookmarks';

export interface TreeExplorerProps {}

export const TreeExplorer: React.FC<TreeExplorerProps> = ({}) => {
  // folding status
  const [globalFolding, setGlobalFolding] = useState<number>(0);

  // tree
  const { tree } = useStorageTree();
  const { selectedIds, setSelected } = useSelectedTree();

  // bookmark
  const { error: errorFromBookmarks } = useBookmarks();

  // error
  const [error, setError] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (errorFromBookmarks !== undefined) {
      setError(errorFromBookmarks);
    } else {
      setError(undefined);
    }
  }, [errorFromBookmarks, setError]);

  return (
    <>
      <div
        id="tree-container"
        className="flex flex-col gap-1 overflow-hidden resize-x min-w-[250px] w-[250px] max-w-[500px] grow-0 shrink-0">
        {/* <h3 className="rounded-sm border-b text-center">Tree Explorer</h3> */}
        <div className="flex flex-row gap-2 justify-around">
          <button
            className="px-2 py-1 rounded-md hover:cursor-pointer border hover:bg-slate-200 text-sm flex flex-row gap-1 items-center"
            onClick={() => setGlobalFolding(globalFolding < 0 ? globalFolding - 1 : -1)}>
            <FaAnglesUp />
            Collapse All
          </button>
          <button
            className="px-2 py-1 rounded-md hover:cursor-pointer border hover:bg-slate-200 text-sm flex flex-row gap-1 items-center"
            onClick={() => setGlobalFolding(globalFolding > 0 ? globalFolding + 1 : 1)}>
            <FaAnglesDown />
            Expand All
          </button>
        </div>
        <div
          id="tree-content-container"
          className={m('overflow-y-auto mb-2 rounded-md border flex flex-col grow', tree === undefined && 'grow')}>
          {error !== undefined && (
            <span className={m('flex flex-col items-center justify-center italic')}>
              Error
              <br />
              {error}
            </span>
          )}
          {error === undefined && tree === undefined && <LoadingComponent />}
          {error === undefined && tree !== undefined && (
            <Tree
              k={undefined}
              node={tree}
              onSelected={setSelected}
              pathIds={selectedIds}
              globalFolding={globalFolding}
            />
          )}
          {error === undefined && tree !== undefined && tree.meta.children_count === 0 && (
            <i className="text-sm grow flex items-center justify-center">~empty~</i>
          )}
        </div>
      </div>
    </>
  );
};
