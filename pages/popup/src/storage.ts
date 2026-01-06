export type StorageType = 'Local Storage' | 'Session Storage' | 'Cookies' | 'IndexedDB';
export const STORAGE_TYPES: StorageType[] = ['Local Storage', 'Session Storage', 'Cookies', 'IndexedDB'];

export async function getStorageContent(storage: StorageType) {
  if (storage === 'Cookies') {
    return getCookiesContent();
  }

  if (storage === 'IndexedDB') {
    return getIndexedDBContent();
  }

  if (chrome.scripting === undefined) {
    throw new Error(`scripting permission for this page is not granted`);
  }

  const tab = await getCurrentTab();
  if (tab === undefined) {
    throw new Error(`tab is undefined`);
  }
  if (tab.id === undefined) {
    throw new Error(`tab id is undefined`);
  }

  let getStorageFunc;
  if (storage === 'Local Storage') {
    getStorageFunc = () => ({ ...localStorage });
  } else if (storage === 'Session Storage') {
    getStorageFunc = () => ({ ...sessionStorage });
  } else {
    throw new Error(`Storage not supported: "${storage}"`);
  }

  const execution = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getStorageFunc,
  });

  return execution[0].result;
}

async function getCookiesContent(): Promise<Record<string, object>> {
  if (chrome.cookies === undefined) {
    throw new Error(`cookies permission for this page is not granted`);
  }

  const tab = await getCurrentTab();
  if (tab === undefined) {
    throw new Error(`tab is undefined`);
  }
  if (tab.url === undefined) {
    throw new Error(`tab.url is undefined`);
  }

  const cookies = await chrome.cookies.getAll({ url: tab.url });

  const cookiesObject: Record<string, object> = {};
  for (const cookie of cookies) {
    cookiesObject[cookie.name] = {
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString() : 'Session',
    };
  }

  return cookiesObject;
}

async function getIndexedDBContent(): Promise<Record<string, Record<string, unknown[]>>> {
  if (chrome.scripting === undefined) {
    throw new Error(`scripting permission for this page is not granted`);
  }

  const tab = await getCurrentTab();
  if (tab === undefined) {
    throw new Error(`tab is undefined`);
  }
  if (tab.id === undefined) {
    throw new Error(`tab id is undefined`);
  }

  const getIndexedDBFunc = async (): Promise<Record<string, Record<string, unknown[]>>> => {
    const MAX_RECORDS_PER_STORE = 1000;
    const result: Record<string, Record<string, unknown[]>> = {};

    if (typeof indexedDB.databases !== 'function') {
      throw new Error('indexedDB.databases() is not supported in this browser');
    }

    const databases = await indexedDB.databases();

    if (databases.length === 0) {
      return result;
    }

    for (const dbInfo of databases) {
      if (!dbInfo.name) continue;

      const dbName = dbInfo.name;
      result[dbName] = {};

      try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onerror = () => reject(new Error(`Failed to open database: ${dbName}`));
          request.onsuccess = () => resolve(request.result);
        });

        const storeNames = Array.from(db.objectStoreNames);

        for (const storeName of storeNames) {
          try {
            const records = await new Promise<unknown[]>((resolve, reject) => {
              const transaction = db.transaction(storeName, 'readonly');
              const store = transaction.objectStore(storeName);
              const allRecords: unknown[] = [];
              let count = 0;

              const cursorRequest = store.openCursor();
              cursorRequest.onerror = () => reject(new Error(`Failed to read store: ${storeName}`));
              cursorRequest.onsuccess = event => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor && count < MAX_RECORDS_PER_STORE) {
                  allRecords.push({
                    _key: cursor.key,
                    _value: cursor.value,
                  });
                  count++;
                  cursor.continue();
                } else {
                  resolve(allRecords);
                }
              };
            });
            result[dbName][storeName] = records;
          } catch (storeError) {
            result[dbName][storeName] = [{ _error: String(storeError) }];
          }
        }

        db.close();
      } catch (dbError) {
        result[dbName] = { _error: [{ message: String(dbError) }] };
      }
    }

    return result;
  };

  const execution = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getIndexedDBFunc,
  });

  return execution[0].result;
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (tab === undefined) {
    throw new Error(`tab is undefined`);
  }
  return tab;
}

export async function getCurrentOrigin() {
  const tab = await getCurrentTab();
  if (tab.url === undefined) {
    throw new Error(`tab.url is undefined`);
  }
  let origin = new URL(tab.url).origin;
  if (!origin.endsWith('/')) {
    origin += '/'; // requestPermission requires this forward slash to work
  }
  return origin;
}

export async function checkPermission() {
  const origin = await getCurrentOrigin();
  // reject all non webpage url
  if (!origin.startsWith('https://') && !origin.startsWith('http://')) {
    throw new Error(`Cannot access non http/https webpage`);
  }

  // as long as we get local storage successfully, then we have permissions
  const granted = (await getStorageContent('Local Storage')) !== undefined;
  if (!granted) {
    throw new Error(`Permission not granted to access this page`);
  }
}

export function isObject(obj: unknown) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function isArray(obj: unknown) {
  return obj && Array.isArray(obj);
}

export function isString(obj: unknown) {
  return typeof obj === 'string';
}

export function isNumber(obj: unknown) {
  return typeof obj === 'number';
}

export function isBoolean(obj: unknown) {
  return typeof obj === 'boolean';
}

export function toHumanSize(kb: number) {
  if (kb >= 1000_000) {
    return `${(kb / 1000_000).toFixed(2)} GB`;
  } else if (kb >= 1000) {
    return `${(kb / 1000).toFixed(2)} MB`;
  } else {
    // (kb < 1000)
    return `${kb.toFixed(2)} KB`;
  }
}

function pad(any: number, pad: number, size: number) {
  let s = new String(any);
  while (s.length < size) {
    s = String(pad) + s;
  }
  return s;
}
export function toHumanDate(date: Date) {
  return `${pad(date.getHours(), 0, 2)}:${pad(date.getMinutes(), 0, 2)}:${pad(date.getSeconds(), 0, 2)}`;
}

export function parseRecursive(raw: unknown, depth: number, searchText: string | undefined): TreeNode {
  console.log(`parsing depth=${depth}, searchText=${searchText}`);
  return parseRecursiveInternal(raw, depth, 0, searchText?.toLowerCase(), undefined, undefined, 1, true)[0];
}

function parseRecursiveInternal(
  raw: unknown,
  max_depth: number,
  depth: number,
  searchText: string | undefined,
  parent: TreeNode | undefined,
  key: string | undefined,
  id: number,
  tryInterpretString: boolean,
): [TreeNode, number] {
  let raw_type: ContentType = 'string';
  let parsed_type: ContentType = 'string';
  let clipboard_value;
  let js_value;

  if (isObject(raw)) {
    js_value = raw;
    clipboard_value = JSON.stringify(raw);
    raw_type = 'object';
    parsed_type = 'object';
  } else if (isArray(raw)) {
    js_value = raw;
    clipboard_value = JSON.stringify(raw);
    raw_type = 'array';
    parsed_type = 'array';
  } else if (isNumber(raw)) {
    js_value = raw;
    clipboard_value = String(raw);
    raw_type = 'number';
    parsed_type = 'number';
  } else if (isBoolean(raw)) {
    js_value = raw;
    clipboard_value = String(raw);
    raw_type = 'boolean';
    parsed_type = 'boolean';
  } else if (isString(raw)) {
    const raw_string = String(raw);
    clipboard_value = raw_string;
    js_value = raw;
    raw_type = 'string';
    parsed_type = 'string';
    if (tryInterpretString) {
      try {
        // handle json string
        js_value = JSON.parse(raw_string);
        if (isObject(js_value)) {
          parsed_type = 'object';
        } else if (isArray(js_value)) {
          parsed_type = 'array';
        } else if (isNumber(js_value)) {
          parsed_type = 'number';
        } else if (isBoolean(js_value)) {
          parsed_type = 'boolean';
        } else {
          // it can be null
          parsed_type = 'string';
        }
      } catch {
        // not json parsable, we try float and url
        raw_type = 'string';
        parsed_type = 'string';
        const maybeNumber = parseFloat(raw_string);
        if (!isNaN(raw_string as unknown as number) && !isNaN(maybeNumber)) {
          // https://stackoverflow.com/a/68821383
          js_value = maybeNumber;
          parsed_type = 'number';
        } else {
          const maybeUrl = URL.parse(raw_string);
          if (maybeUrl !== null) {
            js_value = maybeUrl;
            parsed_type = 'url';
          }
        }
      }
    }
  } else {
    raw_type = 'string';
    parsed_type = 'string';
    clipboard_value = String(raw);
    js_value = raw;
  }

  // set typical value
  const node: TreeNode = {
    javascript_value: js_value, // string / object / array
    clipboard_value: clipboard_value, // string
    children: {}, // key map to node
    parent: parent,
    key: key,
    meta: {
      raw_type: raw_type,
      parsed_type: parsed_type,
      depth: depth,
      satisfy_search:
        (parent && parent.meta.satisfy_search) ||
        searchText === undefined ||
        searchText === '' ||
        (key !== undefined && key.toLowerCase().includes(searchText)),
      id: id,
      children_count: 0, // set later
    },
  };

  // set children count & search
  if (depth < max_depth) {
    // handles children
    let key_value_pairs: [string, unknown, boolean][] | undefined = undefined;
    switch (node.meta.parsed_type) {
      case 'object':
        key_value_pairs = Object.entries(node.javascript_value).map(([k, v]) => [k, v, true]);
        break;
      case 'array':
        key_value_pairs = (node.javascript_value as unknown as unknown[]).map((value, i) => {
          return [String(i), value, true];
        });
        break;
      case 'url': {
        const url = node.javascript_value as unknown as URL;
        key_value_pairs = [
          ['hash', url.hash, true],
          ['host', url.host, false], // avoid infinite recusion, because a host is also a valid url
          ['hostname', url.hostname, false],
          ['href', url.href, false],
          ['origin', url.origin, false],
          ['pathname', url.pathname, true],
          ['port', url.port, true],
          ['protocol', url.protocol, false],
          ['query', Object.fromEntries(url.searchParams), true],
        ];
        break;
      }
    }
    if (key_value_pairs !== undefined) {
      // if it has children, we populate children fields
      node.meta.children_count = key_value_pairs.length;
      for (const [k, v, tryInterpretString] of key_value_pairs) {
        [node.children[k], id] = parseRecursiveInternal(
          v,
          max_depth,
          depth + 1,
          searchText,
          node,
          k,
          id + 1,
          tryInterpretString,
        );
      }
    }
  }

  if (!node.meta.satisfy_search) {
    // any child satisfy search, then parents are satisfied search
    for (const child of Object.values(node.children)) {
      if (child.meta.satisfy_search) {
        node.meta.satisfy_search = true;
        break;
      }
    }
  }

  if (!node.meta.satisfy_search) {
    // we search directly in the clipboard, not just the leaf node's clipboard, this is because:
    // content: {"id":114183601395907,"view_at":1742377410} => search for 'view_at' or '1742377410' works ok, this is because we do search in leaf node and key
    // content: {"id":114183601395907,"view_at":1742377410} => search for '{"id":114183601395907,"view_at":1742377410}' fails if we only search in leaf node and key, because we break the text into smaller pieces, effectively search in the key and leaf value separately
    // but if we search the raw value then the search will work, but this is expensive tho, we avoid it if we already found something in key or leaf node, so I put it at the very end
    if (searchText && node.clipboard_value?.toLowerCase().includes(searchText)) {
      node.meta.satisfy_search = true;
    }
  }

  return [node, id];
}

export interface TreeNode {
  javascript_value: string | object | unknown[];
  clipboard_value: string;
  children: { [key: string | number]: TreeNode };
  parent: TreeNode | undefined;
  key: string | undefined;
  meta: TreeNodeMetadata;
}

export type ContentType = 'object' | 'array' | 'number' | 'string' | 'boolean' | 'url';

export interface TreeNodeMetadata {
  raw_type: ContentType;
  parsed_type: ContentType;
  depth: number;
  satisfy_search: boolean;
  id: number;
  children_count: number;
}
