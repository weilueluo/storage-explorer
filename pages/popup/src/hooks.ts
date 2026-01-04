import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useDebounce, useTimeoutFn } from 'react-use';
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
  isVisible: boolean;
  message: string;
  showToast: (msg: string) => void;
}

export function useToast(duration: number = 1500): UseToast {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const [, , reset] = useTimeoutFn(() => {
    setIsVisible(false);
  }, duration);

  const showToast = useCallback(
    (msg: string) => {
      setMessage(msg);
      setIsVisible(true);
      reset();
    },
    [reset],
  );

  return { isVisible, message, showToast };
}
