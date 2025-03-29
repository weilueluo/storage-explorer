import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { FaAngleRight } from 'react-icons/fa';
import { FaBookmark, FaCaretRight, FaCheck, FaLink, FaRegBookmark, FaRegCircle } from 'react-icons/fa6';
import { LuBrackets, LuFileText } from 'react-icons/lu';
import { MdNumbers } from 'react-icons/md';
import { VscJson } from 'react-icons/vsc';
import { useBookmarks } from './context-bookmarks';
import type { TreeNode } from './storage';
import { m } from './utils';

export const Tree: React.FC<{
  k: string | undefined;
  node: TreeNode | undefined;
  onSelected: (treeNode: TreeNode | undefined) => unknown;
  pathIds: Set<number>;
  globalFolding: number;
}> = ({ k, node, onSelected, pathIds, globalFolding }) => {
  const isRoot = k === undefined;
  const isActive = node && pathIds.has(node.meta.id);

  const [isOpen, setIsOpen] = useState<boolean>(isRoot);
  const [isTypeHovered, setIsTypeHovered] = useState<boolean>(false);
  const [isNodeHovered, setIsNodeHovered] = useState<boolean>(false);

  const onClick = () => {
    setIsOpen(!isOpen);
    onSelected(node);
  };

  const slideInStyle = {
    minWidth: isTypeHovered ? '1rem' : '0rem', // Slide from left
    width: isTypeHovered ? '1rem' : '0rem', // Slide from left
    opacity: isTypeHovered ? 1 : 0, // Fade in
    transition: 'width 0.2s ease-out, min-width 0.2s ease-out, opacity 0.2s ease-out', // Smooth transition
  };

  const rotationStyle = {
    // transition: 'transform 0.2s ease-out',
    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: 'transform 0.1s ease-out', // Smooth transition
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

  const { setBookmark, unsetBookmark, isBookmarked: checkIsBookmarked } = useBookmarks();

  // set is bookmarked
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  useEffect(() => {
    setIsBookmarked(checkIsBookmarked(node));
  }, [setIsBookmarked, checkIsBookmarked, node]);

  const onClickBookmark = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!isBookmarked) {
        const name = prompt(`Name for this bookmark`, node?.key);
        if (name) {
          setBookmark(name, node);
        } else {
          // name not given, user clicked outside of the box, probably regret setting bookmark
        }
      } else {
        unsetBookmark(node);
      }
    },
    [isBookmarked, node, setBookmark, unsetBookmark],
  );

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
          className={m(
            'flex flex-row justify-between items-center w-full rounded-sm',
            isNodeHovered && 'bg-slate-200',
            isActive && 'bg-slate-300',
          )}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={onClick}>
          {(Object.keys(node.children).length > 0 && (
            <FaAngleRight style={{ marginRight: '2px', ...rotationStyle }} />
          )) || <FaRegCircle style={{ padding: '3px', marginRight: '2px' }} />}
          <span className={m('inline-block truncate mr-1 hover:cursor-pointer grow')} title={k}>
            {k}
          </span>
          <div className="flex flex-row items-center">
            <div
              className="flex flex-row items-center"
              onMouseOver={() => setIsTypeHovered(true)}
              onFocus={() => setIsTypeHovered(true)}
              onMouseOut={() => setIsTypeHovered(false)}
              onBlur={() => setIsTypeHovered(false)}
              title={
                (node.meta.raw_type !== node.meta.parsed_type &&
                  `This node is stored as "${node.meta.raw_type}" but can be parsed into "${node.meta.parsed_type}"`) ||
                `This node has type "${node.meta.raw_type}"`
              }>
              {node.meta.raw_type === 'object' && <VscJson style={{ strokeWidth: 1, ...slideInStyle }} />}
              {node.meta.raw_type === 'array' && <LuBrackets style={{ strokeWidth: 2.5, ...slideInStyle }} />}
              {node.meta.raw_type === 'number' && <MdNumbers style={slideInStyle} />}
              {node.meta.raw_type === 'string' && <LuFileText style={slideInStyle} />}
              {node.meta.raw_type === 'boolean' && <FaCheck style={slideInStyle} />}
              {node.meta.raw_type === 'url' && <FaLink style={slideInStyle} />}
              {<FaCaretRight style={slideInStyle} />}
              {node.meta.parsed_type === 'object' && <VscJson style={{ strokeWidth: 1 }} />}
              {node.meta.parsed_type === 'array' && <LuBrackets style={{ strokeWidth: 2.5 }} />}
              {node.meta.parsed_type === 'number' && <MdNumbers />}
              {node.meta.parsed_type === 'string' && <LuFileText />}
              {node.meta.parsed_type === 'boolean' && <FaCheck />}
              {node.meta.parsed_type === 'url' && <FaLink />}
            </div>
            <div
              className={m('hover:cursor-pointer')}
              role="button"
              tabIndex={0}
              onClick={onClickBookmark}
              onKeyDown={onClickBookmark}>
              {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
            </div>
          </div>
        </div>
      )}
      {isOpen && (
        <ul className={m(!isRoot && 'pl-4', 'flex flex-col w-full')}>
          {Object.entries(node.children).map(([k, v]) => (
            <Tree key={k} k={k} node={v} onSelected={onSelected} pathIds={pathIds} globalFolding={globalFolding} />
          ))}
        </ul>
      )}
    </div>
  );
};
