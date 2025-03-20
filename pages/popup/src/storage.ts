export async function getLocalStorageContent() {
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

  const execution = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({ ...localStorage }),
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

async function getCurrentOrigin() {
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
  const granted = (await getLocalStorageContent()) !== undefined;
  if (!granted) {
    throw new Error(`Permission not granted to access this page`);
  }
}

export async function requestPermission() {
  const origin = await getCurrentOrigin();
  if (!origin.startsWith('https://') && !origin.startsWith('http://')) {
    throw new Error(`Cannot access non http/https webpage`);
  }
  await chrome.permissions.request({
    permissions: ['scripting'],
    origins: [origin],
  }); // chrome does not have second argument callback
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
      is_leaf: true,
      raw_type: raw_type,
      parsed_type: parsed_type,
      depth: depth,
      satisfy_search: (parent && parent.meta.satisfy_search) || searchText === undefined || searchText === '',
      id: id,
      children_count: 0, // set later
    },
  };

  // set is_leaf & search
  if (depth < max_depth) {
    let setSatisfyLater = false;
    if (node.meta.parsed_type === 'object') {
      node.meta.is_leaf = false;
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
      node.meta.is_leaf = false;
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
        }
      });
      node.meta.children_count = count;
    }
    if (setSatisfyLater) {
      node.meta.satisfy_search = true;
    }
  }

  // handle search for this node if it does not have any children
  if (!node.meta.satisfy_search) {
    if (node.meta.is_leaf || depth >= max_depth) {
      if (searchText !== undefined && searchText !== '' && node.clipboard_value?.toLowerCase().includes(searchText)) {
        node.meta.satisfy_search = true;
      }
    } else {
      // any child satisfy search, then parents are satisfied search
      for (const child of Object.values(node.children)) {
        if (child.meta.satisfy_search) {
          node.meta.satisfy_search = true;
          break;
        }
      }
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

export type ContentType = 'object' | 'array' | 'number' | 'string';

export interface TreeNodeMetadata {
  is_leaf: boolean;
  raw_type: ContentType;
  parsed_type: ContentType;
  depth: number;
  satisfy_search: boolean;
  id: number;
  children_count: number;
}
