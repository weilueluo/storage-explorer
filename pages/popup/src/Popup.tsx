import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { checkPermission, getLocalStorageContent, parseRecursive, TreeNode } from './storage';
import React, { useEffect, useState } from 'react';

const Popup = async () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  // const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const logo = 'popup/icon48.png';

  const [ls, setLs] = useState<TreeNode | undefined>(undefined);

  useEffect(() => {
    getLocalStorageContent().then(ls => {
      if (!ls) {
        return;
      }
      const parsed = parseRecursive(ls, 5);
      setLs(parsed);
    });
  }, [setLs]);

  console.log(`ls=${JSON.stringify(ls)}`);

  useEffect(() => {
    console.log('checking permission');
    checkPermission();
  });

  return (
    <div className={`${isLight ? 'bg-slate-50' : 'bg-gray-800'} p-2`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <div className="flex flex-row items-center gap-2">
          <img src={chrome.runtime.getURL(logo)} alt="logo" width={32} height={32} />
          <h2 className="font-bold text-xl">Storage Explorer</h2>
        </div>
        <p>Easily view and copy from storage</p>
        {(ls && <Tree k="root" node={ls} />) || 'none'}
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);

const Tree: React.FC<{ k: string; node: TreeNode }> = ({ k, node }) => {
  return (
    <div>
      <p>{k}</p>
      <ul className="ml-2">
        {Object.entries(node.children).map(([k, v]) => (
          <Tree key={k} k={k} node={v} />
        ))}
      </ul>
    </div>
  );
};
