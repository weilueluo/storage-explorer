import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { checkPermission, getLocalStorageContent, parseRecursive, TreeNode } from './storage';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import { FaAngleRight, FaArrowRight, FaCaretRight, FaCircle, FaCube, FaRegCircle } from 'react-icons/fa';
import { LuBraces, LuBrackets, LuFileText } from 'react-icons/lu';
import { IconContext } from 'react-icons';
import { TbArrowNarrowRight, TbBraces, TbBrackets } from 'react-icons/tb';
import { RxFileText, RxText } from 'react-icons/rx';
import { TfiText } from 'react-icons/tfi';
import { MdDataArray, MdNumbers, MdOutlineDataArray, MdOutlineKeyboardArrowRight } from 'react-icons/md';
import { FiType } from 'react-icons/fi';
import { RiArrowDropRightLine, RiArrowRightSFill, RiArrowRightSLine, RiTextSnippet } from 'react-icons/ri';
import { VscJson } from 'react-icons/vsc';
import { m } from './utils';
import { BsArrowRightShort } from 'react-icons/bs';
import { BiSolidRightArrow } from 'react-icons/bi';
import { IoMdArrowDropright } from 'react-icons/io';
import { FaCircleDot } from 'react-icons/fa6';

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

  // get options
  const depth = 10;

  // on load check permission
  useEffect(() => {
    console.log('checking permission');
    checkPermission();
  }, []);

  // on load parse local storage
  useEffect(() => {
    getLocalStorageContent().then(storage => {
      const parsed = parseRecursive(storage, depth, searchTextDebounced);
      // console.log(`parsed=${JSON.stringify(parsed, null, 2)}`)
      setTreeNode(parsed);
    });
  }, [setTreeNode, searchTextDebounced]);

  // selected node
  const [selectedNode, setSelectedNode] = useState<TreeNode | undefined>(undefined);

  const onSelected = (e: React.MouseEvent<HTMLSpanElement>, treeNode: TreeNode) => {
    setSelectedNode(treeNode);
  };

  useEffect(() => {
    console.log('selectedNode');
    console.log(selectedNode);
  }, [selectedNode]);

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

  return (
    <IconContext.Provider value={{ className: 'react-icons' }}>
      <div className={`${isLight ? 'bg-slate-50' : 'bg-gray-800'} flex flex-col h-full w-full overflow-hidden`}>
        <header className={m(`${isLight ? 'text-gray-900' : 'text-gray-100'}`)}>
          <div className="flex flex-row items-center gap-2">
            <img src={chrome.runtime.getURL(logo)} alt="logo" width={32} height={32} />
            <h2 className="font-bold text-xl">Storage Explorer</h2>
          </div>
          <p>Easily view and copy from storage</p>
          <input
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition duration-200"
            onChange={onSearchChange}
          />
        </header>

        <div className="inter-tree-node grid grid-auto-rows grid-cols-3 h-full w-full">
          <div className="col-start-1 col-end-2 h-full w-full flex flex-col">
            <h3>Tree Explorer</h3>
            <div className="bg-neutral-200 overflow-auto grow basis-0">
              {(treeNode && <Tree k={undefined} node={treeNode} onSelected={onSelected} />) || <i>empty</i>}
            </div>
          </div>
          <div className="col-start-2 col-end-4 h-full w-full flex flex-col">
            <h3>Viewer</h3>
            <div className="flex flex-row gap-2">
              <button
                className="px-2 rounded-md hover:cursor-pointer bg-slate-200 hover:bg-slate-300"
                onClick={copyRaw}>
                Copy
              </button>
              <button
                className="px-2 rounded-md hover:cursor-pointer bg-slate-200 hover:bg-slate-300"
                onClick={copyParsed}>
                Copy (pretty)
              </button>
            </div>
            <div className="text-balanced overflow-auto grow basis-0">
              <pre>{selectedNode && JSON.stringify(selectedNode.javascript_value, null, 4)}</pre>
            </div>
          </div>
        </div>
      </div>
    </IconContext.Provider>
  );
};

export default withErrorBoundary(Popup, <div> Error Occur </div>);

const Tree: React.FC<{
  k: string | undefined;
  node: TreeNode;
  onSelected: (e: React.MouseEvent<HTMLSpanElement>, treeNode: TreeNode) => unknown;
}> = ({ k, node, onSelected }) => {
  if (!node.meta.satisfy_search) {
    return null;
  }
  const isRoot = k === undefined;

  const [open, setOpen] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHover, setIsHover] = useState<boolean>(false);

  const slideInStyle = {
    width: isVisible ? '1rem' : '0rem', // Slide from left
    opacity: isVisible ? 1 : 0, // Fade in
    transition: 'width 0.2s ease-out, opacity 0.2s ease-out', // Smooth transition
  };
  const rotationStyle = {
    transition: 'transform 0.2s ease-out',
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
  };

  return (
    <div onMouseOver={() => setIsHover(true)} onMouseOut={() => setIsHover(false)}>
      <div>
        {!isRoot && (
          <div className="flex flex-row items-center">
            {(Object.keys(node.children).length > 0 && (
              <FaCaretRight style={{ marginRight: '2px', ...rotationStyle }} onClick={() => setOpen(!open)} />
            )) || <FaRegCircle style={{ padding: '3px', marginRight: '2px' }} />}
            <span
              className={m('inline-block truncate mr-1 max-w-[300px] hover:cursor-pointer', isHover && 'text-red-600')}
              title={k}
              onClick={e => onSelected(e, node)}>
              {k}
            </span>
            <div
              className="flex flex-row items-center"
              onMouseOver={() => setIsVisible(true)}
              onMouseOut={() => setIsVisible(false)}
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
      {open && (
        <ul className={m(!isRoot && 'ml-4')}>
          {Object.entries(node.children).map(([k, v]) => (
            <Tree key={k} k={k} node={v} onSelected={onSelected} />
          ))}
        </ul>
      )}
    </div>
  );
};
