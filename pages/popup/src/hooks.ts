import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useDebounce } from 'react-use';
import { useToastContext } from './context-toast';
import { getCurrentOrigin } from './storage';

export interface UseOrigin {
  origin: string | undefined;
  error: string;
}

export function useOrigin() {
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  getCurrentOrigin()
    .then(origin => {
      setOrigin(origin);
    })
    .catch(err => setError(String(err)));

  return {
    origin,
    error,
  };
}

export interface UseDebouncedSearchText {
  searchText: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function useDebouncedSearchText() {
  const [searchText, setSearchText] = useState('');
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target?.value), [setSearchText]);
  const [searchTextDebounced, setSearchTextDebounced] = useState('');
  useDebounce(() => setSearchTextDebounced(searchText), 350, [searchText]);

  return {
    searchText: searchTextDebounced,
    onChange,
  };
}

export interface UseToast {
  showToast: (msg: string) => void;
}

export function useToast(): UseToast {
  const { showToast } = useToastContext();
  return { showToast };
}
