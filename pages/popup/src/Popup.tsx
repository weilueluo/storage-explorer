import { withErrorBoundary } from '@extension/shared';
import '@src/Popup.css';
import type { Dispatch, SetStateAction } from 'react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { IconContext } from 'react-icons';
import { FaSync } from 'react-icons/fa';
import { BookmarkProvider } from './context-bookmarks';
import { SelectedTreeProvider } from './context-selected-node';
import { StorageTreeProvider, useStorageTree } from './context-storage';
import { Footer } from './Footer';
import { Header } from './Header';
import { useOrigin } from './hooks';
import { StorageTypeProvider, useStorageType } from './storage-type';
import { TreeExplorer } from './TreeExplorer';
import { TreeViewer } from './TreeViewer';
import { m } from './utils';

const Popup: React.FC = () => {
  return (
    <IconContext.Provider value={{ className: 'react-icons' }}>
      <StorageTreeProvider>
        <SelectedTreeProvider>
          <StorageTypeProvider>
            <BookmarkProvider>
              <PopupContent />
            </BookmarkProvider>
          </StorageTypeProvider>
        </SelectedTreeProvider>
      </StorageTreeProvider>
    </IconContext.Provider>
  );
};

const PopupContent: React.FC = () => {
  // handle errors
  const { error: storageTreeError } = useStorageTree();
  const { error: storageTypeError } = useStorageType();

  const [error, setError] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (storageTreeError || storageTypeError) {
      const errorMessage = [storageTreeError, storageTypeError].filter(e => !!e).join('; ');
      setError(errorMessage);
    }
  }, [setError, storageTreeError, storageTypeError]);

  return (
    <div id="all-container" className={`inter-tree-node flex flex-col gap-1 grow overflow-hidden`}>
      <header id="header-container" className={m('text-gray-900 h-fit flex flex-col gap-2')}>
        <Header />
      </header>

      {error !== undefined && <ErrorComponent errorMessage={error} setErrorMessage={setError} />}

      {error === undefined && (
        <>
          <div id="content-container" className="flex flex-row gap-2 grow overflow-hidden">
            <TreeExplorer />
            <TreeViewer />
          </div>

          <div id="footer-container" className="flex flex-row gap-2 rounded-md w-full justify-between h-[1rem]">
            <Footer />
          </div>
        </>
      )}
    </div>
  );
};

export default withErrorBoundary(Popup, <div> Error Occured </div>);

const requestScriptingPermission = (origin: string) => {
  if (!origin.startsWith('https://') && !origin.startsWith('http://')) {
    throw new Error(`Cannot access non http/https webpage`);
  }
  setTimeout(() => window.close(), 200); // close the window because it blocks the request permission pop up
  chrome.permissions.request({
    permissions: ['scripting'],
    origins: [origin],
  }); // chrome does not have second argument callback
};

const ErrorComponent: React.FC<{
  errorMessage: string | undefined;
  setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
}> = ({ errorMessage, setErrorMessage }) => {
  const { origin, error } = useOrigin();

  const request = () => {
    if (origin === undefined) {
      throw new Error(error);
    }
    try {
      requestScriptingPermission(origin);
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
