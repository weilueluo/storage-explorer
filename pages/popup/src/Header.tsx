import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaHdd, FaDatabase } from 'react-icons/fa';
import { StorageType, STORAGE_TYPES } from './storage';
import { m } from './utils';
import { useDebouncedSearchText } from './hooks';
import { useStorageTree } from './context-storage';
import { useStorageType } from './storage-type';

export const Header: React.FC = () => {
  const logo = 'popup/icon48.png';

  // rotate storage type
  const { storageType, updateStorageType } = useStorageType();
  const nextStorageType = useCallback(() => {
    let nextIndex = (STORAGE_TYPES.indexOf(storageType) + 1) % STORAGE_TYPES.length;
    console.log(`updateing to ${STORAGE_TYPES[nextIndex]}`);
    updateStorageType(STORAGE_TYPES[nextIndex]);
  }, [storageType, updateStorageType]);

  // search text
  const { searchText, onChange } = useDebouncedSearchText();

  const { reload } = useStorageTree();
  const refresh = useCallback(() => {
    reload(storageType, searchText, 10);
  }, [storageType, searchText]);
  // refresh on change search and storage type
  useEffect(() => refresh(), [searchText, storageType]);

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
        <a
          href="https://github.com/weilueluo/storage-explorer"
          target="_blank"
          className="hover:bg-slate-200 rounded-sm">
          <img src={chrome.runtime.getURL(logo)} alt="logo" style={{ width: 24, height: 24 }} />
        </a>
        {/* <h2 className="font-bold text-xl">Storage Explorer</h2> */}
      </div>
      <button
        className="px-2 rounded-md hover:cursor-pointer border border-1 hover:bg-slate-200 text-sm flex flex-row gap-2 items-center justify-center"
        onClick={nextStorageType}>
        {storageType === 'Local Storage' && <FaHdd />}
        {storageType === 'Session Storage' && <FaDatabase />}
        {storageType}
      </button>
      <input
        className="grow rounded-md px-2 py-1 border border-1 h-[2rem] focus-visible:outline-none focus-visible:border-slate-400"
        onChange={onChange}
        ref={searchRef}
        placeholder="type to search..."
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
  );
};
