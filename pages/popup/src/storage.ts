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
    throw new Error(`permission not granted`);
  }
}

export function isObject(obj: any) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function isArray(obj: any) {
  return obj && Array.isArray(obj);
}

export function isString(obj: any) {
  return typeof obj === 'string' || typeof obj === 'String';
}

export function getAsNumber(anything: any) {
  if (!isString(anything)) {
    anything = String(anything);
  }
  return parseInt(anything, 10);
}

export function parseRecursive(raw: Storage, depth: number): TreeNode {
  return parseRecursiveInternal(raw, depth, 0);
}

function parseRecursiveInternal(raw: Storage, max_depth: number, depth: number): TreeNode {
  let is_object = false;
  let is_object_tag = false; // node maybe an object but not a object tag, because leaf node (max depth reached) always display full content, even if it is an object
  let is_array = false;
  let is_array_tag = false; // similar to above
  let is_string_tag = false;
  let clipboard_value;
  let display_value;
  let js_value;

  if (isObject(raw)) {
    js_value = raw;
    clipboard_value = JSON.stringify(raw);
    display_value = 'type object';
    is_object = true;
    is_object_tag = true;
  } else if (isArray(raw)) {
    js_value = raw;
    clipboard_value = JSON.stringify(raw);
    display_value = 'type array';
    is_array = true;
    is_array_tag = true;
  } else if (isString(raw)) {
    try {
      // handle json string
      js_value = JSON.parse(raw as unknown as string);
      clipboard_value = String(raw);
      display_value = 'type string';
      is_string_tag = true;
      if (isObject(js_value)) {
        is_object = true;
      } else if (isArray(js_value)) {
        is_array = true;
      } else {
        // it can be value like: true / false / 1 / null, fk JSON.parse
        // see also: https://stackoverflow.com/a/33369954/6880256
        display_value = String(raw);
      }
    } catch (err) {
      // handle normal string
      display_value = String(raw);
      clipboard_value = String(raw);
      js_value = raw;
    }
  } else {
    display_value = String(raw);
    clipboard_value = String(raw);
    js_value = raw;
  }

  // set typical value

  const node: TreeNode = {
    js_value: js_value, // string / object / array
    display_value: display_value, // string / "object" / "array"
    clipboard_value: clipboard_value, // string
    is_leaf: true,
    is_object: is_object,
    is_object_tag: is_object_tag,
    is_array: is_array,
    is_array_tag: is_array_tag,
    is_string_tag: is_string_tag,
    children: {}, // key map to node
    has_parent: depth > 1,
    depth: depth,
  };

  // set is_leaf
  if (depth < max_depth) {
    if (node.is_object) {
      node.is_leaf = false;
      for (const [k, v] of Object.entries(node.js_value)) {
        node.children[k] = parseRecursiveInternal(v, max_depth, depth + 1);
      }
    } else if (node.is_array) {
      node.is_leaf = false;
      // @ts-ignore
      node.js_value.forEach((value, i) => {
        node.children[i] = parseRecursiveInternal(value, max_depth, depth + 1);
      });
    }
  }

  // for leaf node, always display content, not its type information
  if (node.is_leaf) {
    node.display_value = node.clipboard_value;
    node.is_array_tag = false;
    node.is_object_tag = false;
    node.is_string_tag = false;
  }

  return node;
}

export interface TreeNode {
  js_value: string | object | any[];
  display_value: string;
  clipboard_value: string;
  is_leaf: boolean;
  is_object: boolean;
  is_object_tag: boolean;
  is_array: boolean;
  is_array_tag: boolean;
  is_string_tag: boolean;
  children: { [key: string | number]: TreeNode };
  has_parent: boolean;
  depth: number;
}
