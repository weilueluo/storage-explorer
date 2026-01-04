import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageEnum, SessionAccessLevelEnum } from './enums.js';

// We need to import createStorage dynamically after setting up mocks
// because the module captures globalThis.chrome at import time

describe('createStorage', () => {
  // Mock storage area factory
  const createMockStorageArea = () => ({
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    setAccessLevel: vi.fn().mockResolvedValue(undefined),
  });

  let mockChrome: {
    storage: {
      local: ReturnType<typeof createMockStorageArea>;
      sync: ReturnType<typeof createMockStorageArea>;
      session: ReturnType<typeof createMockStorageArea>;
      managed: ReturnType<typeof createMockStorageArea>;
    };
  };

  beforeEach(() => {
    // Create fresh mocks
    mockChrome = {
      storage: {
        local: createMockStorageArea(),
        sync: createMockStorageArea(),
        session: createMockStorageArea(),
        managed: createMockStorageArea(),
      },
    };
    // Setup global chrome mock
    (globalThis as Record<string, unknown>).chrome = mockChrome;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).chrome;
    vi.resetModules();
  });

  describe('Initialization', () => {
    it('should create storage with default config', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      expect(storage).toBeDefined();
      expect(storage.get).toBeDefined();
      expect(storage.set).toBeDefined();
      expect(storage.subscribe).toBeDefined();
      expect(storage.getSnapshot).toBeDefined();
    });

    it('should use Local storage by default', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      await storage.get();
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['testKey']);
    });

    it('should respect storageEnum config', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue', {
        storageEnum: StorageEnum.Sync,
      });
      await storage.get();
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['testKey']);
    });
  });

  describe('get()', () => {
    it('should return fallback when key does not exist', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'fallbackValue');
      const result = await storage.get();
      expect(result).toBe('fallbackValue');
    });

    it('should return stored value when key exists', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ testKey: 'storedValue' });
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'fallbackValue');
      const result = await storage.get();
      expect(result).toBe('storedValue');
    });

    it('should deserialize value using custom deserializer', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ testKey: '{"name":"test"}' });
      const { createStorage } = await import('./base.js');
      const storage = createStorage<{ name: string }>(
        'testKey',
        { name: 'default' },
        {
          serialization: {
            serialize: v => JSON.stringify(v),
            deserialize: v => JSON.parse(v as string),
          },
        },
      );
      const result = await storage.get();
      expect(result).toEqual({ name: 'test' });
    });
  });

  describe('set()', () => {
    it('should set value directly', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      await storage.set('newValue');
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'newValue' });
    });

    it('should serialize value using custom serializer', async () => {
      // Pre-populate cache with valid JSON
      mockChrome.storage.local.get.mockResolvedValue({ testKey: '{"name":"default"}' });
      const { createStorage } = await import('./base.js');
      const storage = createStorage<{ name: string }>(
        'testKey',
        { name: 'default' },
        {
          serialization: {
            serialize: v => JSON.stringify(v),
            deserialize: v => (v ? JSON.parse(v as string) : { name: 'default' }),
          },
        },
      );
      await storage.set({ name: 'test' });
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ testKey: '{"name":"test"}' });
    });
  });

  describe('subscribe()', () => {
    it('should add listener and return unsubscribe function', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listeners on set', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      const listener = vi.fn();
      storage.subscribe(listener);
      await storage.set('newValue');
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('getSnapshot()', () => {
    it('should return null before initialization completes', async () => {
      // Make get() never resolve
      mockChrome.storage.local.get.mockImplementation(() => new Promise(() => {}));
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      // Immediately check snapshot before initialization
      expect(storage.getSnapshot()).toBe(null);
    });
  });

  describe('Live Updates', () => {
    it('should register change listener when liveUpdate is true', async () => {
      const { createStorage } = await import('./base.js');
      createStorage('testKey', 'defaultValue', {
        liveUpdate: true,
      });
      expect(mockChrome.storage.local.onChanged.addListener).toHaveBeenCalled();
    });

    it('should not register change listener when liveUpdate is false', async () => {
      const { createStorage } = await import('./base.js');
      createStorage('testKey', 'defaultValue', {
        liveUpdate: false,
      });
      expect(mockChrome.storage.local.onChanged.addListener).not.toHaveBeenCalled();
    });

    it('should update cache when storage changes externally', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ testKey: 'initialValue' });
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue', {
        liveUpdate: true,
      });

      // Wait for initialization
      await storage.get();

      const listener = vi.fn();
      storage.subscribe(listener);
      listener.mockClear();

      // Get the registered change handler
      const changeHandler = mockChrome.storage.local.onChanged.addListener.mock.calls[0][0];

      // Simulate external storage change
      await changeHandler({ testKey: { newValue: 'externalValue' } });

      expect(listener).toHaveBeenCalled();
      expect(storage.getSnapshot()).toBe('externalValue');
    });

    it('should ignore changes for other keys', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ testKey: 'initialValue' });
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue', {
        liveUpdate: true,
      });

      // Wait for initialization
      await storage.get();

      const listener = vi.fn();
      storage.subscribe(listener);
      listener.mockClear();

      // Get the registered change handler
      const changeHandler = mockChrome.storage.local.onChanged.addListener.mock.calls[0][0];

      // Simulate change for different key
      await changeHandler({ otherKey: { newValue: 'otherValue' } });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe()', () => {
    it('should remove listener when unsubscribe is called', async () => {
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);

      // Clear any initial calls
      listener.mockClear();

      // Unsubscribe
      unsubscribe();

      // Set should not trigger the listener anymore
      await storage.set('newValue');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('get() edge cases', () => {
    it('should return fallback when chrome.storage returns undefined', async () => {
      mockChrome.storage.local.get.mockResolvedValue(undefined);
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'fallbackValue');
      const result = await storage.get();
      expect(result).toBe('fallbackValue');
    });
  });

  describe('set() with function updater', () => {
    it('should call function updater with previous cache value', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ testKey: 'initial' });
      const { createStorage } = await import('./base.js');
      const storage = createStorage('testKey', 'defaultValue');

      // Wait for initialization
      await storage.get();

      // Use function updater
      await storage.set((prev: string) => prev + '_updated');

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'initial_updated' });
    });
  });
});
