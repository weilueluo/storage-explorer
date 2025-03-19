import type React from 'react';
import { useEffect, useState } from 'react';
import { FaAngleRight, FaCaretRight, FaRegCircle } from 'react-icons/fa';
import { LuBrackets, LuFileText } from 'react-icons/lu';
import { MdNumbers } from 'react-icons/md';
import { VscJson } from 'react-icons/vsc';
import type { TreeNode } from './storage';
import { m } from './utils';

export const Tree: React.FC<{
  k: string | undefined;
  node: TreeNode;
  onSelected: (treeNode: TreeNode) => unknown;
  pathIds: Set<number>;
  doCollapse: number;
  doExpand: number;
}> = ({ k, node, onSelected, pathIds, doCollapse, doExpand }) => {
  const isRoot = k === undefined;
  const isActive = pathIds.has(node.meta.id);

  const [isOpen, setIsOpen] = useState<boolean>(isRoot);
  const [isTypeHovered, setIsTypeHovered] = useState<boolean>(false);
  const [isNodeHovered, setIsNodeHovered] = useState<boolean>(false);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

  // collapse if instructed
  useEffect(() => {
    if (doCollapse > 0 && !isRoot) {
      setIsOpen(false);
    }
  }, [doCollapse]);

  // expand if instructed
  useEffect(() => {
    if (doExpand > 0 && !isRoot) {
      setIsOpen(true);
    }
  }, [doExpand]);

  if (!node.meta.satisfy_search) {
    return null;
  }

  return (
    <div onMouseOver={() => setIsNodeHovered(true)} onMouseOut={() => setIsNodeHovered(false)}>
      <div>
        {!isRoot && (
          <div
            className={m(
              'flex flex-row items-center rounded-sm',
              isNodeHovered && 'bg-slate-200',
              isActive && 'bg-slate-300',
            )}
            onClick={e => onClick(e)}>
            {(Object.keys(node.children).length > 0 && (
              <FaAngleRight style={{ marginRight: '2px', ...rotationStyle }} />
            )) || <FaRegCircle style={{ padding: '3px', marginRight: '2px' }} />}
            <span className={m('inline-block truncate mr-1 max-w-[300px] hover:cursor-pointer')} title={k}>
              {k}
            </span>
            <div
              className="flex flex-row items-center"
              onMouseOver={() => setIsTypeHovered(true)}
              onMouseOut={() => setIsTypeHovered(false)}
              title={
                (node.meta.raw_type !== node.meta.parsed_type &&
                  `This node has type "${node.meta.raw_type}" but can be translate to type "${node.meta.parsed_type}"`) ||
                `This node has type "${node.meta.raw_type}"`
              }>
              {node.meta.raw_type === 'object' && <VscJson style={{ strokeWidth: 1, ...slideInStyle }} />}
              {node.meta.raw_type === 'array' && <LuBrackets style={{ strokeWidth: 2.5, ...slideInStyle }} />}
              {node.meta.raw_type === 'number' && <MdNumbers style={slideInStyle} />}
              {node.meta.raw_type === 'string' && <LuFileText style={slideInStyle} />}
              {<FaCaretRight style={slideInStyle} />}
              {node.meta.parsed_type === 'object' && <VscJson style={{ strokeWidth: 1 }} />}
              {node.meta.parsed_type === 'array' && <LuBrackets style={{ strokeWidth: 2.5 }} />}
              {node.meta.parsed_type === 'number' && <MdNumbers />}
              {node.meta.parsed_type === 'string' && <LuFileText />}
            </div>
          </div>
        )}
      </div>
      {isOpen && (
        <ul className={m(!isRoot && 'ml-4')}>
          {Object.entries(node.children).map(([k, v]) => (
            <Tree
              key={k}
              k={k}
              node={v}
              onSelected={onSelected}
              pathIds={pathIds}
              doCollapse={doCollapse}
              doExpand={doExpand}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
