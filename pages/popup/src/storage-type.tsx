import { createStorage } from '@extension/storage/lib/base';
import { STORAGE_TYPES, StorageType } from './storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { varName } from './utils';

export interface UseStorageType {
  storageType: StorageType;
  updateStorageType: (storageType: StorageType) => void;
  error: string | undefined;
}

const StorageTypeContext = createContext<UseStorageType>({
  storageType: STORAGE_TYPES[0],
  updateStorageType: (storageType: StorageType) => {
    throw new Error(`${varName(StorageTypeContext)} not initialized`);
  },
  error: undefined,
});
const storageTypeStorage = createStorage('storage-type', STORAGE_TYPES[0]);

export const StorageTypeProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [storageType, setStorageType] = useState<StorageType>(STORAGE_TYPES[0]);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    storageTypeStorage
      .get()
      .then(storageType => setStorageType(storageType))
      .catch(err => setError(String(err)));
  }, []);

  const updateStorageType = useCallback(
    (newStoragType: StorageType) => {
      storageTypeStorage.set(newStoragType).then(() => setStorageType(newStoragType));
    },
    [setStorageType],
  );

  return (
    <StorageTypeContext.Provider value={{ storageType, updateStorageType, error }}>
      {children}
    </StorageTypeContext.Provider>
  );
};

export const useStorageType = (): UseStorageType => {
  return useContext(StorageTypeContext);
};
