import type React from 'react';
import { FaAngleRight } from 'react-icons/fa';
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
      <div className="flex flex-row items-center align-middle text-sm truncate overflow-clip">
        {selectedPath.map((node, i) => {
          return (
            <>
              {i > 0 && <FaAngleRight />}
              <span
                className="hover:cursor-pointer min-w-[10px] max-w-[200px] rounded-sm truncate grow hover:bg-slate-200"
                onClick={() => setSelected(node)}
                onKeyDown={() => setSelected(node)}
                role="button"
                tabIndex={0}
                title={node.key}>
                {node.key}
              </span>
            </>
          );
        })}
      </div>
      <div className="flex flex-row gap-2 items-center italic">
        <span className="text-nowrap text-sm">Timestamp: {stats?.timestamp && toHumanDate(stats?.timestamp)}</span>
        <span className="text-nowrap text-sm">Size: {stats?.size && toHumanSize(stats?.size)}</span>
      </div>
    </>
  );
};
