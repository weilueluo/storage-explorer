import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { HardDrive, Database, X, RefreshCw, MessageSquare } from 'lucide-react';
import { Button, Input, Tooltip, TooltipContent, TooltipTrigger } from '@extension/ui';
import { STORAGE_TYPES } from './storage';
import { useDebouncedSearchText } from './hooks';
import { useStorageTree } from './context-storage';
import { useStorageType } from './storage-type';

export const Header: React.FC = () => {
  const logo = 'popup/icon48.png';

  // rotate storage type
  const { storageType, updateStorageType } = useStorageType();
  const nextStorageType = useCallback(() => {
    const nextIndex = (STORAGE_TYPES.indexOf(storageType) + 1) % STORAGE_TYPES.length;
    console.log(`updateing to ${STORAGE_TYPES[nextIndex]}`);
    updateStorageType(STORAGE_TYPES[nextIndex]);
  }, [storageType, updateStorageType]);

  // search text
  const { searchText, onChange } = useDebouncedSearchText();

  const { reload } = useStorageTree();
  const refresh = useCallback(() => {
    reload(storageType, searchText, 10);
  }, [reload, storageType, searchText]);
  // refresh on change search and storage type
  useEffect(() => refresh(), [refresh, searchText, storageType]);

  // focus search on start
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchRef && searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  // clear button
  const clear = useCallback(() => {
    if (searchRef && searchRef.current) {
      searchRef.current.value = '';
      searchRef.current.focus();
    }
  }, []);

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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={nextStorageType} className="gap-2">
            {storageType === 'Local Storage' && <HardDrive className="h-4 w-4" />}
            {storageType === 'Session Storage' && <Database className="h-4 w-4" />}
            {storageType}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Switch storage type</TooltipContent>
      </Tooltip>
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
