export type StorageType = 'Local Storage' | 'Session Storage';
export const STORAGE_TYPES: StorageType[] = ['Local Storage', 'Session Storage'];

export async function getStorageContent(storage: StorageType) {
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

function isObject(obj: unknown) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function isArray(obj: unknown) {
  return obj && Array.isArray(obj);
}

function isString(obj: unknown) {
  // @ts-ignore
  return typeof obj === 'string' || typeof obj === 'String';
}

function isNumber(obj: unknown) {
  return typeof obj === 'number';
}

function isStringNumber(obj: string) {
  return !isNaN(parseFloat(obj));
}

function isBoolean(obj: unknown) {
  return typeof obj === 'boolean';
}

function isStringBoolean(obj: string) {
  return obj === 'true' || obj === 'false';
}

function toNumber(obj: unknown) {
  if (typeof obj === 'number') {
    return obj;
  }
  return parseFloat(String(obj));
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
  return parseRecursiveInternal(raw, depth, 0, searchText?.toLowerCase(), undefined, undefined, 1)[0];
}

function parseRecursiveInternal(
  raw: unknown,
  max_depth: number,
  depth: number,
  searchText: string | undefined,
  parent: TreeNode | undefined,
  key: string | undefined,
  id: number,
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
    try {
      // handle json string
      js_value = JSON.parse(raw as unknown as string);
      clipboard_value = String(raw);
      raw_type = 'string';
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
      }
    } catch (err) {
      // not json parsable
      clipboard_value = String(raw);
      if (isStringNumber(clipboard_value)) {
        js_value = toNumber(clipboard_value);
        parsed_type = 'number';
      } else {
        js_value = raw;
      }
    }
  } else {
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
      satisfy_search: (parent && parent.meta.satisfy_search) || searchText === undefined || searchText === '',
      id: id,
      children_count: 0, // set later
    },
  };

  // set children count & search
  if (depth < max_depth) {
    let setSatisfyLater = false;
    if (node.meta.parsed_type === 'object') {
      let count = 0;
      for (const [k, v] of Object.entries(node.javascript_value)) {
        count++;
        if (
          !node.meta.satisfy_search &&
          searchText !== undefined &&
          searchText !== '' &&
          k.toLowerCase().includes(searchText)
        ) {
          node.meta.satisfy_search = true;
          [node.children[k], id] = parseRecursiveInternal(v, max_depth, depth + 1, searchText, node, k, id + 1);
          node.meta.satisfy_search = false;
          setSatisfyLater = true;
        } else {
          [node.children[k], id] = parseRecursiveInternal(v, max_depth, depth + 1, searchText, node, k, id + 1);
        }
      }
      node.meta.children_count = count;
    } else if (node.meta.parsed_type === 'array') {
      let count = 0;
      // @ts-ignore
      node.javascript_value.forEach((value, i) => {
        count++;
        const index = String(i);
        if (
          !node.meta.satisfy_search &&
          searchText !== undefined &&
          searchText !== '' &&
          index.toLowerCase().includes(searchText)
        ) {
          node.meta.satisfy_search = true;
          [node.children[index], id] = parseRecursiveInternal(
            value,
            max_depth,
            depth + 1,
            searchText,
            node,
            index,
            id + 1,
          );
          node.meta.satisfy_search = false;
          setSatisfyLater = true;
        } else {
          [node.children[index], id] = parseRecursiveInternal(
            value,
            max_depth,
            depth + 1,
            searchText,
            node,
            index,
            id + 1,
          );
        }
      });
      node.meta.children_count = count;
    }
    if (setSatisfyLater) {
      node.meta.satisfy_search = true;
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
    // content: {"id":114183601395907,"view_at":1742377410} => search for 'view_at' or '1742377410' works when we only search in leaf node and key
    // content: {"id":114183601395907,"view_at":1742377410} => search for '{"id":114183601395907,"view_at":1742377410}' fails if we only search in leaf node, because we effectively search in the key and leaf value separately
    // this search is expensive tho, we avoid it if we can just search in leaf node, so I put it at the very end
    if (searchText !== undefined && searchText !== '' && node.clipboard_value?.toLowerCase().includes(searchText)) {
      node.meta.satisfy_search = true;
    }
  }

  return [node, id];
}

export interface TreeNode {
  javascript_value: string | object | any[];
  clipboard_value: string;
  children: { [key: string | number]: TreeNode };
  parent: TreeNode | undefined;
  key: string | undefined;
  meta: TreeNodeMetadata;
}

export type ContentType = 'object' | 'array' | 'number' | 'string' | 'boolean';

export interface TreeNodeMetadata {
  raw_type: ContentType;
  parsed_type: ContentType;
  depth: number;
  satisfy_search: boolean;
  id: number;
  children_count: number;
}
