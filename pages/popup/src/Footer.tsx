import type React from 'react';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@extension/ui';
import { toHumanDate, toHumanSize } from './storage';
import { useStorageTree } from './context-storage';
import { useSelectedTree } from './context-selected-node';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FooterProps {}

export const Footer: React.FC<FooterProps> = () => {
  const { stats } = useStorageTree();
  const { selectedPath, setSelected } = useSelectedTree();

  return (
    <>
      <nav className="flex flex-row items-center text-sm truncate overflow-clip gap-0.5">
        {selectedPath.map((node, i) => {
          return (
            <Fragment key={node.meta.id}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              <button
                className={cn(
                  'min-w-[10px] max-w-[150px] rounded-sm truncate px-1',
                  'hover:bg-accent transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                onClick={() => setSelected(node)}
                title={node.key}>
                {node.key}
              </button>
            </Fragment>
          );
        })}
      </nav>
      <div className="flex flex-row gap-3 items-center text-muted-foreground shrink-0">
        <span className="text-nowrap text-xs">{stats?.timestamp && toHumanDate(stats?.timestamp)}</span>
        <span className="text-nowrap text-xs">{stats?.size && toHumanSize(stats?.size)}</span>
      </div>
    </>
  );
};
