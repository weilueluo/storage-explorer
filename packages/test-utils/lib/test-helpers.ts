/**
 * Creates a mock tab object for testing
 */
export function createMockTab(overrides?: Partial<chrome.tabs.Tab>): chrome.tabs.Tab {
  return {
    id: 1,
    index: 0,
    windowId: 1,
    highlighted: true,
    active: true,
    pinned: false,
    incognito: false,
    url: 'https://example.com',
    title: 'Example Page',
    frozen: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    ...overrides,
  } as chrome.tabs.Tab;
}

/**
 * Creates a simple tree node structure for testing
 */
export interface SimpleTreeNode {
  key?: string;
  value: unknown;
  children?: Record<string, SimpleTreeNode>;
}

/**
 * Waits for a specified amount of time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
