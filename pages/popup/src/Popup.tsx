import { withErrorBoundary } from '@extension/shared';
import { TooltipProvider, Button } from '@extension/ui';
import '@src/Popup.css';
import type { Dispatch, SetStateAction } from 'react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { BookmarkProvider } from './context-bookmarks';
import { SelectedTreeProvider } from './context-selected-node';
import { SpotlightProvider } from './context-spotlight';
import { StorageTreeProvider, useStorageTree } from './context-storage';
import { ToastProvider } from './context-toast';
import { Footer } from './Footer';
import { Header } from './Header';
import { useOrigin } from './hooks';
import { StorageTypeProvider, useStorageType } from './storage-type';
import { ToastContainer } from './ToastContainer';
import { TreeExplorer } from './TreeExplorer';
import { TreeViewer } from './TreeViewer';
import { m } from './utils';

const Popup: React.FC = () => {
  return (
    <TooltipProvider delayDuration={300} disableHoverableContent>
      <ToastProvider>
        <StorageTreeProvider>
          <SelectedTreeProvider>
            <SpotlightProvider>
              <StorageTypeProvider>
                <BookmarkProvider>
                  <PopupContent />
                  <ToastContainer />
                </BookmarkProvider>
              </StorageTypeProvider>
            </SpotlightProvider>
          </SelectedTreeProvider>
        </StorageTreeProvider>
      </ToastProvider>
    </TooltipProvider>
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
      <header id="header-container" className={m('text-foreground h-fit flex flex-col gap-2')}>
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
    permissions: ['scripting', 'cookies'],
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
      <span className="flex items-center text-muted-foreground">{errorMessage}</span>
      <Button variant="outline" onClick={request} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
};
