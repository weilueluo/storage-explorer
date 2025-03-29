import { createStorage } from '@extension/storage/lib/base';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentOrigin } from './storage';
import { varName } from './utils';

type BookmarksStorage = { [origin: string]: Bookmarks };
const bookmarkStorage = createStorage<BookmarksStorage>(
  'bookmarks',
  {},
  {
    serialization: {
      serialize: bookmarks => (bookmarks && JSON.stringify(bookmarks)) || '',
      deserialize: str => (str && JSON.parse(str)) || {},
    },
  },
);

export type Bookmarks = { [name: string]: string[] };

const BookmarkContext = createContext<UseBookmarks>({
  bookmarks: undefined,
  updateBookmarks: () => Promise.reject(),
  error: undefined,
});

export interface UseBookmarks {
  bookmarks: Bookmarks | undefined;
  updateBookmarks: (updateFunction: (oldBookmarks: Bookmarks) => Bookmarks) => Promise<void>;
  error: string | undefined;
}

export const BookmarkProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
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

  const updateBookmarks = useCallback(
    async (updateFunction: (oldBookmarks: Bookmarks) => Bookmarks) => {
      await getCurrentOrigin()
        .then(async origin => {
          await bookmarkStorage.set(allBookmarks => {
            allBookmarks[origin] = updateFunction(allBookmarks[origin]);
            setBookmarks(allBookmarks[origin]);
            return allBookmarks;
          });
        })
        .catch(err => setError(String(err)));
    },
    [setBookmarks, setError],
  );

  return <BookmarkContext.Provider value={{ bookmarks, updateBookmarks, error }}>{children}</BookmarkContext.Provider>;
};

export function useBookmarks(): UseBookmarks {
  return useContext(BookmarkContext);
}
