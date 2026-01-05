import type React from 'react';
import { useEffect, useState } from 'react';
import { ChevronsUp, ChevronsDown } from 'lucide-react';
import { Button, ScrollArea, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@extension/ui';
import LoadingComponent from './loading';
import { Tree } from './TreeNode';
import { m } from './utils';
import { useStorageTree } from './context-storage';
import { useSelectedTree } from './context-selected-node';
import { useBookmarks } from './context-bookmarks';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TreeExplorerProps {}

export const TreeExplorer: React.FC<TreeExplorerProps> = () => {
  // folding status
  const [globalFolding, setGlobalFolding] = useState<number>(0);

  // tree
  const { tree } = useStorageTree();
  const { selectedIds, setSelected } = useSelectedTree();

  // bookmark
  const { bookmarkedNodes, error: errorFromBookmarks } = useBookmarks();

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
        className="flex flex-col gap-1 overflow-hidden resize-x min-w-[200px] w-[350px] max-w-[500px] grow-0 shrink-0">
        <div className="flex flex-row gap-2 justify-around">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGlobalFolding(globalFolding < 0 ? globalFolding - 1 : -1)}
                className="gap-1">
                <ChevronsUp className="h-4 w-4" />
                Collapse All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse all tree nodes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGlobalFolding(globalFolding > 0 ? globalFolding + 1 : 1)}
                className="gap-1">
                <ChevronsDown className="h-4 w-4" />
                Expand All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Expand all tree nodes</TooltipContent>
          </Tooltip>
        </div>
        <ScrollArea className="flex-1 rounded-md border">
          <div id="tree-content-container" className={m('flex flex-col pr-3', tree === undefined && 'h-full')}>
            {error !== undefined && (
              <span className={m('flex flex-col items-center justify-center italic text-muted-foreground p-4')}>
                Error
                <br />
                {error}
              </span>
            )}
            {error === undefined && tree === undefined && <LoadingComponent />}
            {error === undefined && bookmarkedNodes !== undefined && Object.values(bookmarkedNodes).length > 0 && (
              <div>
                {Object.entries(bookmarkedNodes).map(([name, node]) => {
                  return (
                    <Tree
                      key={name}
                      k={name}
                      node={node}
                      onSelected={setSelected}
                      pathIds={selectedIds}
                      globalFolding={globalFolding}
                    />
                  );
                })}
                <Separator className="my-2" />
              </div>
            )}
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
              <i className="text-sm grow flex items-center justify-center text-muted-foreground p-4">~empty~</i>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};
