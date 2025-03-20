import { withErrorBoundary } from '@extension/shared';
import '@src/Popup.css';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconContext } from 'react-icons';
import { CgSpinner } from 'react-icons/cg';
import { FaAngleRight, FaCopy, FaRegCopy, FaSync } from 'react-icons/fa';
import { FaAnglesDown, FaAnglesUp } from 'react-icons/fa6';
import { GrCopy } from 'react-icons/gr';
import { useDebounce } from 'react-use';
import type { TreeNode } from './storage';
import {
  checkPermission,
  getCurrentOrigin,
  getLocalStorageContent,
  parseRecursive,
  toHumanDate,
  toHumanSize,
} from './storage';
import { Tree } from './TreeNode';
import { m } from './utils';

const Popup = () => {
  const logo = 'popup/icon48.png';

  // search text logic
  const [searchText, setSearchText] = useState('');
  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target?.value),
    [setSearchText],
  );
  const [searchTextDebounced, setSearchTextDebounced] = useState('');
  const [, cancel] = useDebounce(() => setSearchTextDebounced(searchText), 200, [searchText]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // parsed
  const [treeNode, setTreeNode] = useState<TreeNode | undefined>(undefined);

  // TODO: get options
  const depth = 10;

  // statistics
  const [timestamp, setTimestamp] = useState<Date>();
  const [size, setSize] = useState<number>(0);

  // on load parse local storage
  const [loading, setLoading] = useState<boolean>(false);
  const refresh = useCallback(() => {
    setLoading(true);
    // checkPermission().catch(err => setErrorMessage(String(err)));
    getLocalStorageContent()
      .then(storage => {
        setTimestamp(new Date());
        const parsed = parseRecursive(storage, depth, searchTextDebounced);
        const blob = new Blob([parsed.clipboard_value], {
          type: 'application/json',
        });
        setSize(blob.size);
        console.log(parsed);
        setLoading(false);
        setTreeNode(parsed);
        setErrorMessage(undefined);
      })
      .catch(err => setErrorMessage(String(err)));
  }, [searchTextDebounced, depth, setTreeNode]);
  const clear = useCallback(() => {
    if (searchRef && searchRef.current) {
      searchRef.current.value = '';
      searchRef.current.focus();
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [searchTextDebounced]);

  useEffect(() => {
    checkPermission().catch(err => setErrorMessage(String(err)));
  }, []);

  // selected node
  const [selectedNode, setSelectedNode] = useState<TreeNode | undefined>(undefined);
  const onSelectNode = useCallback(
    (node: TreeNode) => {
      setSelectedNode(node);
    },
    [setSelectedNode, selectedNode],
  );

  // breadcrumb
  const [breadcrumb, setBreadcrumb] = useState<TreeNode[]>([]);
  const [breadcrumbIds, setBreadcrumbIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    const newBreadcrumb = [];
    const newBreadcrumbIds = new Set<number>();
    let head = selectedNode;
    while (head && head.parent != undefined) {
      // skip root, it is a dummy holder to the user
      newBreadcrumb.push(head);
      newBreadcrumbIds.add(head.meta.id);
      head = head.parent;
    }
    setBreadcrumb(newBreadcrumb.reverse());
    setBreadcrumbIds(newBreadcrumbIds);
  }, [selectedNode, setBreadcrumb]);

  // copy
  const copyToClipboard = (text: string | undefined) => {
    if (text === undefined) {
      alert('please select a node from the tree first');
    } else {
      navigator.clipboard.writeText(text).catch(err => alert(err));
    }
  };
  const copyRaw = useCallback(() => copyToClipboard(selectedNode && selectedNode.clipboard_value), [selectedNode]);
  const copyParsed = useCallback(
    () => copyToClipboard(selectedNode && JSON.stringify(selectedNode.javascript_value)),
    [selectedNode],
  );
  const copyPretty = useCallback(
    () => copyToClipboard(selectedNode && JSON.stringify(selectedNode.javascript_value, null, 4)),
    [selectedNode],
  );

  // collapse all
  const [doCollapse, setDoCollapse] = useState<number>(0);

  // expand all
  const [doExpand, setDoExpand] = useState<number>(0);

  // focus search on start
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchRef && searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // misc debugging
  useEffect(() => {
    console.log('selectedNode');
    console.log(selectedNode);
  }, [selectedNode]);

  return (
    <IconContext.Provider value={{ className: 'react-icons' }}>
      <div id="all-container" className={`inter-tree-node flex flex-col gap-1 grow overflow-hidden`}>
        <header id="header-container" className={m('text-gray-900 h-fit flex flex-col gap-2')}>
          <div className="flex flex-row gap-2">
            <div className="flex flex-row gap-2 items-center">
              <a
                href="https://github.com/weilueluo/storage-explorer"
                target="_blank"
                className="hover:bg-slate-200 rounded-sm">
                <img src={chrome.runtime.getURL(logo)} alt="logo" style={{ width: 24, height: 24 }} />
              </a>
              {/* <h2 className="font-bold text-xl">Storage Explorer</h2> */}
            </div>
            <input
              className="grow rounded-md px-2 py-1 border border-1 h-[2rem] focus-visible:outline-none focus-visible:border-slate-400"
              onChange={onSearchChange}
              ref={searchRef}
              placeholder="type anything to search..."
            />
            <button
              className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200 text-sm"
              onClick={clear}>
              Clear
            </button>
            <button
              className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200 text-sm"
              onClick={refresh}>
              Refresh
            </button>
          </div>
        </header>

        {errorMessage && (
          <ErrorComponent errorMessage={errorMessage} setErrorMessage={setErrorMessage} refresh={refresh} />
        )}

        {!errorMessage && loading && <LoadingComponent />}

        {!loading && !errorMessage && (
          <>
            <div id="content-container" className="flex flex-row gap-2 grow overflow-hidden">
              <div
                id="tree-container"
                className="flex flex-col gap-1 overflow-hidden resize-x min-w-[250px] w-[250px] max-w-[500px] grow-0 shrink-0">
                <h3 className="rounded-sm border-b border-1 text-center">Tree Explorer</h3>
                <div className="flex flex-row gap-2 justify-around">
                  <button
                    className="px-2 py-1 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200 text-sm flex flex-row gap-1 items-center"
                    onClick={() => setDoCollapse(doCollapse + 1)}>
                    <FaAnglesUp />
                    Collapse All
                  </button>
                  <button
                    className="px-2 py-1 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200 text-sm flex flex-row gap-1 items-center"
                    onClick={() => setDoExpand(doExpand + 1)}>
                    <FaAnglesDown />
                    Expand All
                  </button>
                </div>
                <div id="tree-content-container" className="overflow-y-auto mb-2 rounded-md border-y border-1 flex">
                  {treeNode && (
                    <Tree
                      k={undefined}
                      node={treeNode}
                      onSelected={onSelectNode}
                      pathIds={breadcrumbIds}
                      doCollapse={doCollapse}
                      doExpand={doExpand}
                    />
                  )}
                  {treeNode && treeNode.meta.children_count === 0 && (
                    <i className="text-sm grow flex items-center justify-center">~empty~</i>
                  )}
                </div>
              </div>
              <div id="view-container" className="flex flex-col grow gap-1 overflow-hidden">
                <h3 className="rounded-sm border-b border-1 text-center">Viewer</h3>
                <div className="flex flex-row gap-2 justify-around">
                  <button
                    className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border border-1 text-sm flex flex-row gap-1 items-center"
                    onClick={copyParsed}>
                    <FaCopy />
                    Copy
                  </button>
                  <button
                    className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border border-1 text-sm flex flex-row gap-1 items-center"
                    onClick={copyRaw}>
                    <FaRegCopy />
                    Copy Raw
                  </button>
                  <button
                    className="px-2 py-1 rounded-md hover:bg-slate-200 hover:cursor-pointer border border-1 text-sm flex flex-row gap-1 items-center"
                    onClick={copyPretty}>
                    <GrCopy />
                    Copy Pretty
                  </button>
                </div>
                <div id="view-content-container" className="overflow-auto rounded-md grow border border-1 flex">
                  <pre>{JSON.stringify(selectedNode?.javascript_value, null, 4)}</pre>
                  {!selectedNode && (
                    <i className="flex grow items-center justify-center text-sm">
                      ~please select a node from the tree~
                    </i>
                  )}
                </div>
              </div>
            </div>

            <div id="footer-container" className="flex flex-row gap-2 rounded-md w-full justify-between h-[1rem]">
              <div className="flex flex-row items-center align-middle text-sm truncate">
                {breadcrumb.map((node, i) => {
                  return (
                    <>
                      {i > 0 && <FaAngleRight />}
                      <span
                        className="hover:cursor-pointer min-w-[20px] rounded-sm truncate hover:bg-slate-200"
                        onClick={() => onSelectNode(node)}
                        title={node.key}>
                        {node.key}
                      </span>
                    </>
                  );
                })}
              </div>
              <div className="flex flex-row gap-2 items-center italic">
                <span className="text-nowrap text-sm">Last Updated: {timestamp && toHumanDate(timestamp)}</span>
                <span className="text-nowrap text-sm">Size: {size && toHumanSize(size)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </IconContext.Provider>
  );
};

export default withErrorBoundary(Popup, <div> Error Occur </div>);

const LoadingComponent: React.FC<{}> = ({}) => {
  return (
    <span className="flex flex-row gap-2 grow items-center justify-center text-xl">
      <CgSpinner className="animate-spin" /> loading ...
    </span>
  );
};

const ErrorComponent: React.FC<{
  errorMessage: string | undefined;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
  refresh: () => void;
}> = ({ errorMessage, setErrorMessage, refresh }) => {
  const [origin, setOrigin] = useState<string>('');
  useEffect(() => {
    getCurrentOrigin()
      .then(origin => {
        setOrigin(origin);
      })
      .catch(err => setErrorMessage(String(err)));
  }, [setOrigin]);

  const request = () => {
    try {
      if (!origin.startsWith('https://') && !origin.startsWith('http://')) {
        throw new Error(`Cannot access non http/https webpage`);
      }
      setTimeout(() => window.close(), 200); // close the window because it blocks the request permission pop up
      chrome.permissions.request({
        permissions: ['scripting'],
        origins: [origin],
      }); // chrome does not have second argument callback
    } catch (err) {
      setErrorMessage(String(err));
    }
  };

  return (
    <div className="flex flex-col gap-2 grow justify-center items-center">
      <span className="flex items-center">{errorMessage}</span>
      <button
        className="px-4 py-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200 text-sm flex flex-row gap-1 items-center w-fit"
        onClick={request}>
        <FaSync />
        Retry
      </button>
    </div>
  );
};
