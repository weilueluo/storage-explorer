import { createStorage } from '@extension/storage/lib/base';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStorageTree } from './context-storage';
import type { TreeNode } from './storage';
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

export type Bookmarks = {
  [name: string]: string[];
};

const BookmarkContext = createContext<UseBookmarks>({
  error: undefined,
  isBookmarked: () => false,
  setBookmark: () => {
    throw new Error(`${varName(BookmarkContext)} is not initialized`);
  },
  unsetBookmark: () => {
    throw new Error(`${varName(BookmarkContext)} is not initialized`);
  },
  bookmarkedNodes: {},
});

export interface UseBookmarks {
  error: string | undefined;
  isBookmarked: (tree: TreeNode | undefined) => boolean;
  setBookmark: (name: string, tree: TreeNode | undefined) => Promise<void>;
  unsetBookmark: (tree: TreeNode | undefined) => Promise<void>;
  bookmarkedNodes: { [name: string]: TreeNode | undefined };
}

export const BookmarkProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [bookmarks, setBookmarks] = useState<Bookmarks | undefined>(undefined);
  const [bookmarkedNodes, setBookmarkNodes] = useState<{ [name: string]: TreeNode | undefined }>({});
  const [bookmarkedNodeIds, setBookmarkedNodeIds] = useState<Set<number>>(new Set<number>());
  const [bookmarkedNodesIdToName, setBookmarkedNodesIdToName] = useState<{ [id: number]: string }>({});

  // useEffect(() => {
  //   console.log(`bookmarks`)
  //   console.log(bookmarks)
  // }, [bookmarks])
  // useEffect(() => {
  //   console.log(`bookmarkedNodes`);
  //   console.log(bookmarkedNodes);
  // }, [bookmarkedNodes]);
  // useEffect(() => {
  //   console.log(`bookmarkedNodesIdToName`)
  //   console.log(bookmarkedNodesIdToName)
  // }, [bookmarkedNodesIdToName])

  const reloadBookmarks = useCallback(async () => {
    await getCurrentOrigin()
      .then(origin => {
        bookmarkStorage
          .get()
          .then(allBookmarks => allBookmarks[origin])
          .then(bookmarks => setBookmarks(bookmarks));
      })
      .catch(err => setError(err));
  }, [setBookmarks, setError]);

  useEffect(() => {
    reloadBookmarks();
  }, [reloadBookmarks, setBookmarks]);

  const setBookmarksForThisOrigin = useCallback(
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

  const getPathFromLeaf = (tree: TreeNode) => {
    const path = [];
    let head = tree;
    while (head !== undefined && head.parent !== undefined) {
      // skip root
      path.push(head);
      head = head.parent;
    }
    return path.reverse();
  };

  const setBookmark = useCallback(
    async (name: string, tree: TreeNode | undefined) => {
      if (tree === undefined) {
        return;
      }
      await setBookmarksForThisOrigin(oldBookmarks => {
        const path = getPathFromLeaf(tree).map(node => node.key!);
        if (oldBookmarks === undefined) {
          oldBookmarks = {};
        }
        oldBookmarks[name] = path;
        console.log(`oldBookmarks`);
        console.log(oldBookmarks);
        return oldBookmarks;
      }).then(() => reloadBookmarks());
    },
    [reloadBookmarks, setBookmarksForThisOrigin],
  );

  const unsetBookmark = useCallback(
    async (tree: TreeNode | undefined) => {
      if (tree === undefined) {
        return;
      }
      if (tree && bookmarkedNodesIdToName) {
        const bookmarkName = bookmarkedNodesIdToName[tree.meta.id];
        if (bookmarkName !== undefined) {
          await setBookmarksForThisOrigin(oldBookmarks => {
            if (oldBookmarks[bookmarkName] !== undefined) {
              delete oldBookmarks[bookmarkName];
            }
            return oldBookmarks;
          }).then(() => reloadBookmarks());
        }
      }
    },
    [bookmarkedNodesIdToName, reloadBookmarks, setBookmarksForThisOrigin],
  );

  const { tree } = useStorageTree();

  // on change tree/bookmark, search and update bookmarked nodes
  useEffect(() => {
    const getRecursive = (tree: TreeNode, path: string[]): TreeNode | undefined => {
      if (path.length === 0) {
        return tree;
      } else {
        console.log(`path[0] === tree.key, ${path[0]} === ${tree.key} => ${path[0] === tree.key}`);
        if (path[0] === tree.key) {
          const childPath = path.slice(1);
          console.log(`childPath=${childPath.length === 0}`);
          if (childPath.length === 0) {
            return tree;
          }
          if (tree.children) {
            for (const child of Object.values(tree.children)) {
              const node = getRecursive(child, childPath);
              if (node !== undefined) {
                return node;
              }
            }
          }
        }
      }
      return undefined;
    };

    if (bookmarks !== undefined && tree !== undefined) {
      const bookmarkedNodes: { [name: string]: TreeNode | undefined } = {};
      for (const [name, path] of Object.entries(bookmarks)) {
        for (const child of Object.values(tree.children)) {
          const node = getRecursive(child, path);
          if (node !== undefined) {
            bookmarkedNodes[name] = node;
            break;
          }
        }
      }

      setBookmarkNodes(bookmarkedNodes);
    }
  }, [tree, bookmarks, setBookmarkNodes]);

  // on change bookmarked nodes, update bookmarked nodes id
  useEffect(() => {
    const ids = new Set<number>();
    Object.values(bookmarkedNodes).forEach(tree => tree !== undefined && ids.add(tree.meta.id));
    setBookmarkedNodeIds(ids);
  }, [bookmarkedNodes, setBookmarkedNodeIds]);

  // on change bookmarked nodes, update bookmarked node id to key
  useEffect(() => {
    const newBookmarkedNodesIdToName: { [id: number]: string } = {};
    Object.entries(bookmarkedNodes).forEach(([name, node]) => {
      if (node !== undefined) {
        newBookmarkedNodesIdToName[node.meta.id] = name;
      }
    });
    setBookmarkedNodesIdToName(newBookmarkedNodesIdToName);
  }, [bookmarkedNodes, setBookmarkedNodesIdToName]);

  // is bookmarked interface impl
  const isBookmarked = useCallback(
    (tree: TreeNode | undefined) => {
      if (tree === undefined) {
        return false;
      }
      return bookmarkedNodeIds.has(tree.meta.id);
    },
    [bookmarkedNodeIds],
  );

  return (
    <BookmarkContext.Provider value={{ isBookmarked, error, setBookmark, unsetBookmark, bookmarkedNodes }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export function useBookmarks(): UseBookmarks {
  return useContext(BookmarkContext);
}
