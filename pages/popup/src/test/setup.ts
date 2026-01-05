import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver - needed for Radix UI ScrollArea and Tooltip
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock;

// Create clipboard mock functions that can be accessed in tests
export const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
export const clipboardReadText = vi.fn().mockResolvedValue('');

export const clipboardMock = {
  writeText: clipboardWriteText,
  readText: clipboardReadText,
};

// Mock chrome API
const mockChrome = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    id: 'test-extension-id',
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    session: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      setAccessLevel: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
  },
  scripting: {
    executeScript: vi.fn().mockResolvedValue([{ result: {} }]),
  },
};

// Setup global chrome mock
vi.stubGlobal('chrome', mockChrome);

// Mock navigator.clipboard - jsdom doesn't provide this by default
// We need to define it since jsdom's clipboard might not exist
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboardMock,
    writable: true,
    configurable: true,
  });
} else {
  // If it exists, try to override its methods
  try {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: clipboardWriteText,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator.clipboard, 'readText', {
      value: clipboardReadText,
      writable: true,
      configurable: true,
    });
  } catch {
    // If we can't override, just define a new clipboard object
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardMock,
      writable: true,
      configurable: true,
    });
  }
}

// Mock window.prompt
vi.stubGlobal('prompt', vi.fn());

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
