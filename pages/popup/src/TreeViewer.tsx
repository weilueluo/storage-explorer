import type React from 'react';
import { useCallback, useState } from 'react';
import { FaCopy, FaRegCopy } from 'react-icons/fa';
import { useSelectedTree } from './context-selected-node';
import { useToast } from './hooks';
import { m } from './utils';

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
          .then(() => showToast('Copied!'))
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
      <div className="flex flex-row items-center justify-between px-2 py-1 bg-slate-100 rounded-md">
        <span className="font-medium text-sm truncate" title={tree?.key ?? ''}>
          {tree?.key ?? <i className="text-slate-400">No key selected</i>}
        </span>
        <button
          className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border text-sm flex flex-row gap-1 items-center flex-shrink-0"
          onClick={copyKey}
          title="Copy the key of this value">
          <FaCopy />
          Copy Key
        </button>
      </div>
      <div id="view-content-container" className={m('overflow-auto rounded-md grow border flex relative')}>
        {/* Floating copy buttons - positioned at top-right */}
        {tree !== undefined && error === undefined && (
          <div className="absolute top-1 right-1 flex flex-row gap-1 z-10">
            <button
              className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border text-sm flex flex-row gap-1 items-center bg-white/90"
              onClick={copyParsed}
              title="Copy the converted representation of this value">
              <FaCopy />
              Copy
            </button>
            <button
              className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border text-sm flex flex-row gap-1 items-center bg-white/90"
              onClick={copyRaw}
              title="Copy the raw representation of this value">
              <FaRegCopy />
              Copy Raw
            </button>
          </div>
        )}
        {error === undefined && (
          <>
            {tree !== undefined && <pre className="pt-8">{JSON.stringify(tree?.javascript_value, null, 4)}</pre>}
            {tree === undefined && (
              <i className="flex grow items-center justify-center text-sm">~please select a node from the tree~</i>
            )}
          </>
        )}
        {error !== undefined && (
          <span className={m('flex items-center justify-center italic')}>
            Error
            <br />
            {error}
          </span>
        )}
      </div>
    </div>
  );
};
