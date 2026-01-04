import { vi, type Mock } from 'vitest';

export interface MockStorageArea {
  get: Mock;
  set: Mock;
  onChanged: {
    addListener: Mock;
    removeListener: Mock;
  };
  setAccessLevel: Mock;
}

export interface MockChrome {
  storage: {
    local: MockStorageArea;
    sync: MockStorageArea;
    session: MockStorageArea;
    managed: MockStorageArea;
  };
  tabs: {
    query: Mock;
  };
  scripting: {
    executeScript: Mock;
  };
  runtime: {
    id: string;
  };
}

export function createMockStorageArea(): MockStorageArea {
  return {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    setAccessLevel: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockChrome(): MockChrome {
  return {
    storage: {
      local: createMockStorageArea(),
      sync: createMockStorageArea(),
      session: createMockStorageArea(),
      managed: createMockStorageArea(),
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
    },
    scripting: {
      executeScript: vi.fn().mockResolvedValue([{ result: {} }]),
    },
    runtime: {
      id: 'test-extension-id',
    },
  };
}

export function setupGlobalChrome(mockChrome?: Partial<MockChrome>): MockChrome {
  const chrome = createMockChrome();
  if (mockChrome) {
    Object.assign(chrome, mockChrome);
  }
  (globalThis as unknown as { chrome: MockChrome }).chrome = chrome;
  return chrome;
}

export function clearGlobalChrome(): void {
  delete (globalThis as unknown as { chrome?: MockChrome }).chrome;
}
