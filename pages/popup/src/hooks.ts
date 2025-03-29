import { createStorage } from '@extension/storage/lib/base';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
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
  const [, cancel] = useDebounce(() => setSearchTextDebounced(searchText), 350, [searchText]);

  return {
    searchText: searchTextDebounced,
    onChange,
  };
}

export type Bookmarks = { [name: string]: string[] };

export interface UseBookmarks {
  bookmarks: Bookmarks | undefined;
  updateBookmarks: (updateFunction: (oldBookmarks: Bookmarks) => Bookmarks) => Promise<void>;
  error: string | undefined;
}

type BookmarksStorageFormat = { [origin: string]: Bookmarks };
const bookmarkStorage = createStorage<BookmarksStorageFormat>(
  'bookmarks',
  {},
  {
    serialization: {
      serialize: bookmarks => (bookmarks && JSON.stringify(bookmarks)) || '',
      deserialize: str => (str && JSON.parse(str)) || {},
    },
  },
);

export function useBookmarks(): UseBookmarks {
  const [error, setError] = useState<string | undefined>(undefined);
  const [bookmarks, setBookmarks] = useState<Bookmarks | undefined>(undefined);

  useEffect(() => {
    getCurrentOrigin()
      .then(origin => {
        bookmarkStorage
          .get()
          .then(allBookmarks => allBookmarks[origin])
          .then(bookmarks => setBookmarks(bookmarks));
      })
      .catch(err => setError(err));
  }, []);

  const updateBookmarks = useCallback(async (updateFunction: (oldBookmarks: Bookmarks) => Bookmarks) => {
    await getCurrentOrigin().then(origin => {
      bookmarkStorage.set(allBookmarks => {
        allBookmarks[origin] = updateFunction(allBookmarks[origin]);
        return allBookmarks;
      });
    });
  }, []);

  return {
    bookmarks,
    updateBookmarks,
    error,
  };
}
