export async function getLocalStorageContent() {
  console.log(`getLocalStorageContent`);
  if (chrome.scripting === undefined) {
    throw new Error(`chrome.scripting is undefined`);
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
    alert(`Cannot access non http/https webpage`);
    throw new Error(`Cannot access non http/https webpage`);
  }

  // as long as we get local storage successfully, then we have permissions
  const granted = (await getLocalStorageContent()) !== undefined;
  if (granted) {
    return true;
  } else {
    alert(`Permission not granted to access this page`);
    throw new Error(`Permission not granted to access this page`);
  }
}

function isObject(obj: any) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

function isArray(obj: any) {
  return obj && Array.isArray(obj);
}

function isString(obj: any) {
  // @ts-ignore
  return typeof obj === 'string' || typeof obj === 'String';
}

function isNumber(obj: any) {
  return typeof obj === 'number';
}

function isStringNumber(obj: string) {
  return !isNaN(parseFloat(obj));
}

function stringToNumber(obj: string) {
  return parseFloat(obj);
}

function toNumber(obj: any) {
  if (typeof obj === 'number') {
    return obj;
  }
  return parseFloat(String(obj));
}

export function parseRecursive(raw: unknown, depth: number, searchText: string | undefined): TreeNode {
  console.log(`parsing depth=${depth}, searchText=${searchText}`);
  return parseRecursiveInternal(raw, depth, 0, searchText?.toLowerCase(), false);
}

function parseRecursiveInternal(
  raw: unknown,
  max_depth: number,
  depth: number,
  searchText: string | undefined,
  parentSearchSatisfied: boolean,
): TreeNode {
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
    meta: {
      is_leaf: true,
      raw_type: raw_type,
      parsed_type: parsed_type,
      depth: depth,
      satisfy_search: false,
      has_parent: depth > 1,
    },
  };

  // set is_leaf
  if (depth < max_depth) {
    if (node.meta.parsed_type === 'object') {
      node.meta.is_leaf = false;
      for (const [k, v] of Object.entries(node.javascript_value)) {
        // @ts-ignore: already checked
        const satisfy_search = parentSearchSatisfied || k?.toLowerCase().includes(searchText);
        node.children[k] = parseRecursiveInternal(v, max_depth, depth + 1, searchText, satisfy_search);
      }
    } else if (node.meta.parsed_type === 'array') {
      node.meta.is_leaf = false;
      // @ts-ignore
      node.javascript_value.forEach((value, i) => {
        node.children[i] = parseRecursiveInternal(value, max_depth, depth + 1, searchText, parentSearchSatisfied);
      });
    }
  }

  // handle search for this node
  // note we also handle part of the search logic for children below
  if (parentSearchSatisfied || searchText === undefined || searchText === '') {
    // if we found search in parent's key, then all its children are also satisfied
    node.meta.satisfy_search = true;
  } else if (node.meta.is_leaf || depth >= max_depth) {
    if (node.clipboard_value?.toLowerCase().includes(searchText)) {
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

  // // for leaf node, always display content, not its type information
  // if (node.meta.is_leaf) {
  //   node.meta.is_array_raw = false;
  //   node.meta.is_object_raw = false;
  //   node.meta.is_string_raw = false;
  // }

  return node;
}

export interface TreeNode {
  javascript_value: string | object | any[];
  clipboard_value: string;
  children: { [key: string | number]: TreeNode };
  meta: TreeNodeMetadata;
}

export type ContentType = 'object' | 'array' | 'number' | 'string';

export interface TreeNodeMetadata {
  is_leaf: boolean;
  raw_type: ContentType;
  parsed_type: ContentType;
  has_parent: boolean;
  depth: number;
  satisfy_search: boolean;
}
