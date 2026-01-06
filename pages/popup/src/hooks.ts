import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useDebounce } from 'react-use';
import { useToastContext, type ToastType } from './context-toast';
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
  clear: () => void;
}

export function useDebouncedSearchText(): UseDebouncedSearchText {
  const [searchText, setSearchText] = useState('');
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target?.value), [setSearchText]);
  const [searchTextDebounced, setSearchTextDebounced] = useState('');
  useDebounce(() => setSearchTextDebounced(searchText), 350, [searchText]);

  const clear = useCallback(() => {
    setSearchText('');
    setSearchTextDebounced('');
  }, []);

  return {
    searchText: searchTextDebounced,
    onChange,
    clear,
  };
}

export interface UseToast {
  showToast: (msg: string, type?: ToastType) => void;
}

export function useToast(): UseToast {
  const { showToast } = useToastContext();
  return { showToast };
}

export type { ToastType };

// Clear search callback registration for spotlight feature
// Returns true if search was active (had content to clear)
export type ClearSearchCallback = () => boolean;

let clearSearchCallback: ClearSearchCallback | null = null;

export function registerClearSearch(callback: ClearSearchCallback): () => void {
  clearSearchCallback = callback;
  return () => {
    clearSearchCallback = null;
  };
}

export function triggerClearSearch(): boolean {
  if (clearSearchCallback) {
    return clearSearchCallback();
  }
  return false;
}
