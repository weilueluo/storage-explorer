import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ChevronRight,
  Circle,
  Bookmark,
  Braces,
  Brackets,
  Hash,
  FileText,
  Check,
  Link,
  Flashlight,
} from 'lucide-react';
import { cn } from '@extension/ui';
import { useBookmarks } from './context-bookmarks';
import { useSpotlight } from './context-spotlight';
import type { TreeNode } from './storage';

export const Tree: React.FC<{
  k: string | undefined;
  node: TreeNode | undefined;
  onSelected: (treeNode: TreeNode | undefined) => unknown;
  pathIds: Set<number>;
  globalFolding: number;
  spotlightTrigger: number;
}> = ({ k, node, onSelected, pathIds, globalFolding, spotlightTrigger }) => {
  const isRoot = k === undefined;
  const isActive = node && pathIds.has(node.meta.id);

  const [isOpen, setIsOpen] = useState<boolean>(isRoot);
  const [isTypeHovered, setIsTypeHovered] = useState<boolean>(false);
  const [isNodeHovered, setIsNodeHovered] = useState<boolean>(false);

  const onClick = () => {
    resetSpotlight();
    setIsOpen(!isOpen);
    onSelected(node);
  };

  // collapse/expand if instructed
  useEffect(() => {
    if (!isRoot) {
      if (globalFolding > 0) {
        setIsOpen(true);
      } else if (globalFolding < 0) {
        setIsOpen(false);
      }
    }
  }, [globalFolding, isRoot]);

  // Spotlight expansion: expand only if this node is in selected path
  useEffect(() => {
    if (spotlightTrigger > 0 && !isRoot && node) {
      if (pathIds.has(node.meta.id)) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, [spotlightTrigger, pathIds, node, isRoot]);

  const { setBookmark, unsetBookmark, isBookmarked: checkIsBookmarked } = useBookmarks();
  const { spotlight, resetSpotlight } = useSpotlight();

  // set is bookmarked
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  useEffect(() => {
    setIsBookmarked(checkIsBookmarked(node));
  }, [setIsBookmarked, checkIsBookmarked, node]);

  const onClickBookmark = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!isBookmarked) {
        const name = prompt(`Name for this bookmark`, node?.key);
        if (name) {
          setBookmark(name, node);
        }
      } else {
        unsetBookmark(node);
      }
    },
    [isBookmarked, node, setBookmark, unsetBookmark],
  );

  const onClickSpotlight = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (node) {
        spotlight(node);
      }
    },
    [node, spotlight],
  );

  const TypeIcon = ({ type, className }: { type: string; className?: string }) => {
    switch (type) {
      case 'object':
        return <Braces className={cn('h-3.5 w-3.5', className)} />;
      case 'array':
        return <Brackets className={cn('h-3.5 w-3.5', className)} />;
      case 'number':
        return <Hash className={cn('h-3.5 w-3.5', className)} />;
      case 'string':
        return <FileText className={cn('h-3.5 w-3.5', className)} />;
      case 'boolean':
        return <Check className={cn('h-3.5 w-3.5', className)} />;
      case 'url':
        return <Link className={cn('h-3.5 w-3.5', className)} />;
      default:
        return null;
    }
  };

  if (!node?.meta.satisfy_search) {
    return null;
  }

  return (
    <div
      className="rounded-sm flex flex-col w-full"
      onMouseOver={() => setIsNodeHovered(true)}
      onFocus={() => setIsNodeHovered(true)}
      onMouseOut={() => setIsNodeHovered(false)}
      onBlur={() => setIsNodeHovered(false)}>
      {!isRoot && (
        <div
          className={cn(
            'flex flex-row justify-between items-center w-full rounded-sm px-1 py-0.5',
            'transition-colors duration-150 cursor-pointer',
            'outline-none focus-visible:bg-accent',
            isNodeHovered && 'bg-accent',
            isActive && 'bg-accent/80',
          )}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              onClick();
            }
          }}>
          {Object.keys(node.children).length > 0 ? (
            <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform duration-150', isOpen && 'rotate-90')} />
          ) : (
            <Circle className="h-2 w-2 mx-1 shrink-0 text-muted-foreground" />
          )}
          <span className={cn('min-w-0 truncate mr-1 grow text-sm')} title={k}>
            {k}
          </span>
          <div
            className={cn(
              'flex flex-row items-center gap-0.5 shrink-0',
              'sticky right-2.5 pl-1',
              isNodeHovered ? 'bg-accent' : isActive ? 'bg-accent/80' : 'bg-background',
            )}>
            <div
              className="flex flex-row items-center text-muted-foreground"
              onMouseOver={() => setIsTypeHovered(true)}
              onFocus={() => setIsTypeHovered(true)}
              onMouseOut={() => setIsTypeHovered(false)}
              onBlur={() => setIsTypeHovered(false)}
              title={
                node.meta.raw_type !== node.meta.parsed_type
                  ? `Stored as "${node.meta.raw_type}", parsed as "${node.meta.parsed_type}"`
                  : `Type: "${node.meta.raw_type}"`
              }>
              {node.meta.raw_type !== node.meta.parsed_type && (
                <>
                  <div
                    className={cn(
                      'flex items-center overflow-hidden transition-all duration-200',
                      isTypeHovered ? 'w-4 opacity-100' : 'w-0 opacity-0',
                    )}>
                    <TypeIcon type={node.meta.raw_type} />
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 transition-all duration-200',
                      isTypeHovered ? 'opacity-100' : 'opacity-0 w-0',
                    )}
                  />
                </>
              )}
              <TypeIcon type={node.meta.parsed_type} />
            </div>
            <button
              className={cn(
                'p-0.5 rounded-sm hover:bg-accent transition-colors',
                'outline-none focus-visible:bg-accent',
              )}
              onClick={onClickSpotlight}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onClickSpotlight(e);
                }
              }}
              title="Spotlight this node">
              <Flashlight className="h-3.5 w-3.5" />
            </button>
            <button
              className={cn(
                'p-0.5 rounded-sm hover:bg-accent transition-colors',
                'outline-none focus-visible:bg-accent',
              )}
              onClick={onClickBookmark}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onClickBookmark(e);
                }
              }}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
              <Bookmark className={cn('h-3.5 w-3.5', isBookmarked && 'fill-current')} />
            </button>
          </div>
        </div>
      )}
      {isOpen && (
        <ul className={cn(!isRoot && 'pl-4', 'flex flex-col w-full')}>
          {Object.entries(node.children).map(([childKey, v]) => (
            <Tree
              key={childKey}
              k={childKey}
              node={v}
              onSelected={onSelected}
              pathIds={pathIds}
              globalFolding={globalFolding}
              spotlightTrigger={spotlightTrigger}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
