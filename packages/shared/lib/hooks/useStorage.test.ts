import { describe, it, expect, vi } from 'vitest';

// Test the wrapPromise utility function
// Note: We need to re-implement wrapPromise here for testing since it's not exported
const wrapPromise = <R>(promise: Promise<R>) => {
  let status = 'pending';
  let result: R;
  const suspender = promise.then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    },
  );

  return {
    read() {
      switch (status) {
        case 'pending':
          throw suspender;
        case 'error':
          throw result;
        default:
          return result;
      }
    },
  };
};

describe('wrapPromise', () => {
  describe('pending state', () => {
    it('should throw the promise when pending', () => {
      const promise = new Promise<string>(() => {}); // Never resolves
      const wrapped = wrapPromise(promise);

      expect(() => wrapped.read()).toThrow();
    });

    it('should throw a promise (thenable) when pending', () => {
      const promise = new Promise<string>(() => {});
      const wrapped = wrapPromise(promise);

      try {
        wrapped.read();
        expect.fail('Should have thrown');
      } catch (thrown) {
        expect(thrown).toHaveProperty('then');
      }
    });
  });

  describe('success state', () => {
    it('should return result after promise resolves', async () => {
      const promise = Promise.resolve('test value');
      const wrapped = wrapPromise(promise);

      // Wait for promise to resolve
      await promise;
      // Small delay to ensure status update
      await new Promise(r => setTimeout(r, 0));

      expect(wrapped.read()).toBe('test value');
    });

    it('should return complex objects after resolution', async () => {
      const data = { id: 1, name: 'test' };
      const promise = Promise.resolve(data);
      const wrapped = wrapPromise(promise);

      await promise;
      await new Promise(r => setTimeout(r, 0));

      expect(wrapped.read()).toEqual(data);
    });
  });

  describe('error state', () => {
    it('should throw error after promise rejects', async () => {
      const error = new Error('test error');
      const promise = Promise.reject(error);
      const wrapped = wrapPromise(promise);

      // Wait for promise to reject (and catch to avoid unhandled rejection)
      await promise.catch(() => {});
      await new Promise(r => setTimeout(r, 0));

      expect(() => wrapped.read()).toThrow(error);
    });

    it('should throw the rejection value', async () => {
      const rejectionReason = 'rejection reason';
      const promise = Promise.reject(rejectionReason);
      const wrapped = wrapPromise(promise);

      await promise.catch(() => {});
      await new Promise(r => setTimeout(r, 0));

      expect(() => wrapped.read()).toThrow(rejectionReason);
    });
  });

  describe('state transitions', () => {
    it('should transition from pending to success', async () => {
      let resolve: (value: string) => void;
      const promise = new Promise<string>(r => {
        resolve = r;
      });
      const wrapped = wrapPromise(promise);

      // Initially pending
      expect(() => wrapped.read()).toThrow();

      // Resolve and transition
      resolve!('resolved value');
      await promise;
      await new Promise(r => setTimeout(r, 0));

      // Now success
      expect(wrapped.read()).toBe('resolved value');
    });

    it('should transition from pending to error', async () => {
      let reject: (reason: unknown) => void;
      const promise = new Promise<string>((_, r) => {
        reject = r;
      });
      const wrapped = wrapPromise(promise);

      // Initially pending
      expect(() => wrapped.read()).toThrow();

      // Reject and transition
      const error = new Error('rejected');
      reject!(error);
      await promise.catch(() => {});
      await new Promise(r => setTimeout(r, 0));

      // Now error
      expect(() => wrapped.read()).toThrow(error);
    });
  });
});
