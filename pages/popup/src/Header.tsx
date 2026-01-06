import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { X, RefreshCw, MessageSquare } from 'lucide-react';
import { Button, Input, Tooltip, TooltipContent, TooltipTrigger } from '@extension/ui';
import { useDebouncedSearchText, registerClearSearch, useToast } from './hooks';
import { useStorageTree } from './context-storage';
import { useStorageType, StorageTypeSelector } from './storage-type';

export const Header: React.FC = () => {
  const logo = 'popup/icon48.png';

  const { storageType } = useStorageType();

  // search text
  const { searchText, onChange, clear: clearSearchState } = useDebouncedSearchText();

  const { reload } = useStorageTree();
  const { showToast } = useToast();
  const refresh = useCallback(async () => {
    await reload(storageType, searchText, 10);
    showToast('Refreshed!', 'refreshed');
  }, [reload, storageType, searchText, showToast]);
  // refresh on change search and storage type
  useEffect(() => void refresh(), [refresh, searchText, storageType]);

  // focus search on start
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchRef && searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // Register clear callback for spotlight feature
  // Returns true if search was active (had content to clear)
  useEffect(() => {
    const unregister = registerClearSearch(() => {
      const hadSearch = searchRef.current?.value !== '';
      if (searchRef.current) {
        searchRef.current.value = '';
      }
      clearSearchState();
      return hadSearch;
    });
    return unregister;
  }, [clearSearchState]);

  // clear button
  const clear = useCallback(() => {
    if (searchRef && searchRef.current) {
      searchRef.current.value = '';
      searchRef.current.focus();
    }
    clearSearchState();
    showToast('Cleared!', 'cleared');
  }, [clearSearchState, showToast]);

  return (
    <div className="flex flex-row gap-2">
      <div className="flex flex-row gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="https://github.com/weilueluo/storage-explorer"
              target="_blank"
              className="hover:bg-accent rounded-sm p-0.5 transition-colors">
              <img src={chrome.runtime.getURL(logo)} alt="logo" width={36} height={36} />
            </a>
          </TooltipTrigger>
          <TooltipContent>View on GitHub</TooltipContent>
        </Tooltip>
      </div>
      <StorageTypeSelector />
      <Input className="grow h-8" onChange={onChange} ref={searchRef} placeholder="Type to search..." />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={clear} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Clear search</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={refresh} className="h-8 w-8">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh storage</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <a
              href="https://github.com/weilueluo/storage-explorer/issues/new"
              target="_blank"
              rel="noopener noreferrer">
              <MessageSquare className="h-4 w-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Send feedback</TooltipContent>
      </Tooltip>
    </div>
  );
};
