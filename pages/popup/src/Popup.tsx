import '@src/Popup.css';
import { useStorage, withErrorBoundary } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { checkPermission, getLocalStorageContent, parseRecursive, toHumanDate, toHumanSize, TreeNode } from './storage';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import { IconContext } from 'react-icons';
import { m } from './utils';
import { Tree } from './TreeNode';
import { FaAngleRight } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { CgSpinner } from 'react-icons/cg';

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  // const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const logo = 'popup/icon48.png';

  // search text logic
  const [searchText, setSearchText] = useState('');
  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target?.value),
    [setSearchText],
  );
  const [searchTextDebounced, setSearchTextDebounced] = useState('');
  const [, cancel] = useDebounce(() => setSearchTextDebounced(searchText), 1000, [searchText]);

  // parsed
  const [treeNode, setTreeNode] = useState<TreeNode | undefined>(undefined);

  // TODO: get options
  const depth = 10;

  // on load check permission
  useEffect(() => {
    checkPermission();
  }, []);

  // statistics
  const [timestamp, setTimestamp] = useState<Date>();
  const [size, setSize] = useState<number>(0);

  // on load parse local storage
  const [loading, setLoading] = useState<boolean>(false);
  const refresh = useCallback(() => {
    setLoading(true);
    getLocalStorageContent().then(storage => {
      setTimestamp(new Date());
      const parsed = parseRecursive(storage, depth, searchTextDebounced);
      const blob = new Blob([parsed.clipboard_value], {
        type: 'application/json',
      });
      setSize(blob.size);
      console.log(parsed);
      setLoading(false);
      setTreeNode(parsed);
    });
  }, [searchTextDebounced, depth, setTreeNode]);
  useEffect(() => {
    refresh();
  }, []);

  // selected node
  const [selectedNode, setSelectedNode] = useState<TreeNode | undefined>(undefined);

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
  const copyRaw = useCallback(() => copyToClipboard(selectedNode?.clipboard_value), [selectedNode]);
  const copyParsed = useCallback(
    () => copyToClipboard(selectedNode && JSON.stringify(selectedNode.javascript_value, null, 4)),
    [selectedNode],
  );

  // collapse all
  const [doCollapse, setDoCollapse] = useState<number>(0);

  // expand all
  const [doExpand, setDoExpand] = useState<number>(0);

  // misc debugging
  useEffect(() => {
    console.log('selectedNode');
    console.log(selectedNode);
  }, [selectedNode]);

  return (
    <IconContext.Provider value={{ className: 'react-icons' }}>
      <div className={`${isLight ? 'bg-slate-50' : 'bg-gray-800'} flex flex-col grow overflow-hidden`}>
        <header className={m(`${isLight ? 'text-gray-900' : 'text-gray-100'}`, 'h-fit')}>
          <div className="flex flex-row items-center gap-2">
            <img src={chrome.runtime.getURL(logo)} alt="logo" width={32} height={32} />
            <h2 className="font-bold text-xl">Storage Explorer</h2>
          </div>
          <p>Easily view and copy from storage</p>
          <div className="flex flex-row gap-2">
            <input
              className="grow rounded-md px-2 py-1 border border-1 h-[2rem] focus-visible:outline-1"
              onChange={onSearchChange}
            />
            <button
              className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200"
              onClick={() => refresh()}>
              Refresh
            </button>
          </div>
        </header>

        {(loading && (
          <span>
            <CgSpinner className="animate-spin" /> loading ...
          </span>
        )) || (
          <>
            <div className="inter-tree-node flex flex-row grow overflow-hidden">
              <div className="flex flex-col overflow-hidden resize-x min-w-[250px] w-[250px] grow-0 shrink-0">
                <h3>Tree Explorer</h3>
                <div className="flex flex-row gap-2">
                  <button
                    className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200"
                    onClick={() => setDoCollapse(doCollapse + 1)}>
                    Collapse All
                  </button>
                  <button
                    className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200"
                    onClick={() => setDoExpand(doExpand + 1)}>
                    Expand All
                  </button>
                </div>
                <div className="overflow-y-auto mb-2">
                  {(treeNode && (
                    <Tree
                      k={undefined}
                      node={treeNode}
                      onSelected={setSelectedNode}
                      pathIds={breadcrumbIds}
                      doCollapse={doCollapse}
                      doExpand={doExpand}
                    />
                  )) || <i>empty</i>}
                </div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3>Viewer</h3>
                <div className="flex flex-row gap-2">
                  <button
                    className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200"
                    onClick={copyRaw}>
                    Copy
                  </button>
                  <button
                    className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200"
                    onClick={copyParsed}>
                    Copy (pretty)
                  </button>
                </div>
                <div className="overflow-auto">
                  <pre>{JSON.stringify(selectedNode?.javascript_value, null, 4)}</pre>
                </div>
              </div>
            </div>

            <div className="flex flex-row rounded-md w-full justify-between">
              <div className="flex flex-row gap-1 items-center h-[2rem] align-middle">
                {breadcrumb.map((node, i) => {
                  return (
                    <>
                      {i > 0 && <FaAngleRight />}
                      <span className="hover:cursor-pointer" onClick={() => setSelectedNode(node)}>
                        {node.key}
                      </span>
                    </>
                  );
                })}
              </div>
              <div className="flex flex-row gap-2 items-center">
                <span>Last Updated: {timestamp && toHumanDate(timestamp)}</span>
                <span>Size: {size && toHumanSize(size)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </IconContext.Provider>
  );
};

export default withErrorBoundary(Popup, <div> Error Occur </div>);
