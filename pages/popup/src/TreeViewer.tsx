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
      {/* <h3 className="rounded-sm border-b border-1 text-center">Viewer</h3> */}
      <div className="flex flex-row gap-2 justify-around">
        <button
          className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border text-sm flex flex-row gap-1 items-center"
          onClick={copyKey}
          title="Copy the key of this value">
          <FaCopy />
          Copy Key
        </button>
        <button
          className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border text-sm flex flex-row gap-1 items-center"
          onClick={copyParsed}
          title="Copy the converted representation of this value">
          <FaCopy />
          Copy
        </button>
        <button
          className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border text-sm flex flex-row gap-1 items-center"
          onClick={copyRaw}
          title="Copy the raw representation of this value">
          <FaRegCopy />
          Copy Raw
        </button>
      </div>
      <div id="view-content-container" className={m('overflow-auto rounded-md grow border flex')}>
        {error === undefined && (
          <>
            {tree !== undefined && <pre>{JSON.stringify(tree?.javascript_value, null, 4)}</pre>}
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
