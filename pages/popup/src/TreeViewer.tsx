import type React from 'react';
import { useCallback, useState } from 'react';
import { Copy, ClipboardCopy } from 'lucide-react';
import { Button, ScrollArea, ScrollBar, Tooltip, TooltipContent, TooltipTrigger, cn } from '@extension/ui';
import { useSelectedTree } from './context-selected-node';
import { useToast } from './hooks';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TreeViewerProps {}

export const TreeViewer: React.FC<TreeViewerProps> = () => {
  const [error, setError] = useState<string | undefined>(undefined);
  const { showToast } = useToast();

  const writeToClipboard = useCallback(
    (text: string | undefined) => {
      if (text !== undefined) {
        navigator.clipboard
          .writeText(text)
          .then(() => showToast('Copied!', 'copied'))
          .catch(err => setError(String(err)));
      }
    },
    [setError, showToast],
  );

  const { selectedTree: tree } = useSelectedTree();

  const copyKey = useCallback(() => writeToClipboard(tree?.key), [tree, writeToClipboard]);
  const copyRaw = useCallback(() => writeToClipboard(tree?.clipboard_value), [tree, writeToClipboard]);
  const copyParsed = useCallback(
    () => writeToClipboard(tree && JSON.stringify(tree?.javascript_value)),
    [tree, writeToClipboard],
  );

  return (
    <div id="view-container" className="flex flex-col grow gap-1 overflow-hidden">
      {/* Key Header Row */}
      <div className="flex flex-row items-center justify-between px-2 py-0.5 bg-muted rounded-md">
        <span className="font-medium text-sm truncate" title={tree?.key ?? ''}>
          {tree?.key ?? <span className="text-muted-foreground italic">No key selected</span>}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={copyKey} className="gap-1 h-7">
              <Copy className="h-3.5 w-3.5" />
              Copy Key
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy the key name</TooltipContent>
        </Tooltip>
      </div>
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Floating copy buttons - absolutely positioned over the ScrollArea */}
        {tree !== undefined && error === undefined && (
          <div className="absolute top-2 right-4 flex flex-row gap-1 z-50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyParsed}
                  className="gap-1 h-7 bg-background shadow-sm">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy parsed value</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={copyRaw} className="gap-1 h-7 bg-background shadow-sm">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copy Raw
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy original value</TooltipContent>
            </Tooltip>
          </div>
        )}
        <ScrollArea className="h-full w-full rounded-md border">
          <div id="view-content-container" className="min-h-full">
            {error === undefined && (
              <>
                {tree !== undefined && (
                  <pre className="p-3 pt-10 text-sm font-mono">{JSON.stringify(tree?.javascript_value, null, 2)}</pre>
                )}
                {tree === undefined && (
                  <div className="flex grow items-center justify-center text-sm text-muted-foreground p-8 h-full">
                    ~please select a node from the tree~
                  </div>
                )}
              </>
            )}
            {error !== undefined && (
              <div className={cn('flex flex-col items-center justify-center italic text-destructive p-4')}>
                <span>Error</span>
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
