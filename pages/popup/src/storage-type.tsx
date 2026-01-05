import { createStorage } from '@extension/storage/lib/base';
import type { StorageType } from './storage';
import { STORAGE_TYPES } from './storage';
import type { PropsWithChildren } from 'react';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { varName } from './utils';
import { HardDrive, Database, ChevronDown, Check } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@extension/ui';

export interface UseStorageType {
  storageType: StorageType;
  updateStorageType: (storageType: StorageType) => void;
  error: string | undefined;
}

const StorageTypeContext = createContext<UseStorageType>({
  storageType: STORAGE_TYPES[0],
  updateStorageType: () => {
    throw new Error(`${varName(StorageTypeContext)} not initialized`);
  },
  error: undefined,
});
const storageTypeStorage = createStorage('storage-type', STORAGE_TYPES[0]);

export const StorageTypeProvider: React.FC<PropsWithChildren> = ({ children }) => {
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

const STORAGE_TYPE_ICONS: Record<StorageType, React.ReactNode> = {
  'Local Storage': <HardDrive className="h-4 w-4" />,
  'Session Storage': <Database className="h-4 w-4" />,
};

export const StorageTypeSelector: React.FC = () => {
  const { storageType, updateStorageType } = useStorageType();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          {STORAGE_TYPE_ICONS[storageType]}
          {storageType}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {STORAGE_TYPES.map(type => (
          <DropdownMenuItem key={type} onClick={() => updateStorageType(type)} className="gap-2">
            {STORAGE_TYPE_ICONS[type]}
            {type}
            {type === storageType && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
