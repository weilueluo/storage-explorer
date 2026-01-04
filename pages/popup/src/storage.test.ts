import { describe, it, expect } from 'vitest';
import {
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  toHumanSize,
  toHumanDate,
  parseRecursive,
  type TreeNode,
} from './storage';

describe('Type Guard Functions', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBeFalsy();
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBeFalsy();
      expect(isObject(123)).toBeFalsy();
      expect(isObject(true)).toBeFalsy();
      expect(isObject(undefined)).toBeFalsy();
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b'])).toBe(true);
    });

    it('should return false for objects', () => {
      expect(isArray({})).toBe(false);
      expect(isArray({ length: 3 })).toBe(false);
    });

    it('should return false for null', () => {
      expect(isArray(null)).toBeFalsy();
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
    });

    it('should return false for numbers', () => {
      expect(isString(123)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-45.67)).toBe(true);
      expect(isNumber(NaN)).toBe(true);
    });

    it('should return false for numeric strings', () => {
      expect(isNumber('123')).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for truthy/falsy values', () => {
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('')).toBe(false);
      expect(isBoolean('true')).toBe(false);
    });
  });
});

describe('toHumanSize', () => {
  it('should format bytes as KB when < 1000', () => {
    expect(toHumanSize(0)).toBe('0.00 KB');
    expect(toHumanSize(500)).toBe('500.00 KB');
    expect(toHumanSize(999)).toBe('999.00 KB');
  });

  it('should format bytes as MB when >= 1000 and < 1000000', () => {
    expect(toHumanSize(1000)).toBe('1.00 MB');
    expect(toHumanSize(5000)).toBe('5.00 MB');
    expect(toHumanSize(500000)).toBe('500.00 MB');
  });

  it('should format bytes as GB when >= 1000000', () => {
    expect(toHumanSize(1000000)).toBe('1.00 GB');
    expect(toHumanSize(5000000)).toBe('5.00 GB');
  });

  it('should format with 2 decimal places', () => {
    expect(toHumanSize(1.5)).toBe('1.50 KB');
    expect(toHumanSize(1234.567)).toBe('1.23 MB');
  });
});

describe('toHumanDate', () => {
  it('should format date as HH:MM:SS', () => {
    const date = new Date(2024, 0, 1, 14, 30, 45);
    expect(toHumanDate(date)).toBe('14:30:45');
  });

  it('should pad single digits with leading zeros', () => {
    const date = new Date(2024, 0, 1, 1, 5, 9);
    expect(toHumanDate(date)).toBe('01:05:09');
  });
});

describe('parseRecursive', () => {
  describe('Basic Type Parsing', () => {
    it('should parse plain string', () => {
      const result = parseRecursive({ key: 'hello' }, 10, undefined);
      expect(result.children['key'].javascript_value).toBe('hello');
      expect(result.children['key'].meta.raw_type).toBe('string');
      expect(result.children['key'].meta.parsed_type).toBe('string');
    });

    it('should parse number', () => {
      const result = parseRecursive({ key: 123 }, 10, undefined);
      expect(result.children['key'].javascript_value).toBe(123);
      expect(result.children['key'].meta.raw_type).toBe('number');
      expect(result.children['key'].meta.parsed_type).toBe('number');
    });

    it('should parse boolean', () => {
      const result = parseRecursive({ key: true }, 10, undefined);
      expect(result.children['key'].javascript_value).toBe(true);
      expect(result.children['key'].meta.raw_type).toBe('boolean');
      expect(result.children['key'].meta.parsed_type).toBe('boolean');
    });

    it('should parse null as string', () => {
      const result = parseRecursive({ key: null }, 10, undefined);
      expect(result.children['key'].clipboard_value).toBe('null');
    });
  });

  describe('JSON String Auto-Parsing', () => {
    it('should parse JSON object string into object type', () => {
      const result = parseRecursive({ key: '{"nested": "value"}' }, 10, undefined);
      expect(result.children['key'].meta.raw_type).toBe('string');
      expect(result.children['key'].meta.parsed_type).toBe('object');
      expect(result.children['key'].javascript_value).toEqual({ nested: 'value' });
    });

    it('should parse JSON array string into array type', () => {
      const result = parseRecursive({ key: '[1, 2, 3]' }, 10, undefined);
      expect(result.children['key'].meta.raw_type).toBe('string');
      expect(result.children['key'].meta.parsed_type).toBe('array');
      expect(result.children['key'].javascript_value).toEqual([1, 2, 3]);
    });

    it('should parse nested JSON strings recursively', () => {
      const nestedJson = JSON.stringify({ inner: 'test' });
      const result = parseRecursive({ key: nestedJson }, 10, undefined);
      expect(result.children['key'].children['inner'].javascript_value).toBe('test');
    });

    it('should preserve clipboard_value as original string', () => {
      const jsonStr = '{"nested": "value"}';
      const result = parseRecursive({ key: jsonStr }, 10, undefined);
      expect(result.children['key'].clipboard_value).toBe(jsonStr);
    });
  });

  describe('Number Parsing from Strings', () => {
    it('should parse integer strings to numbers', () => {
      const result = parseRecursive({ key: '123' }, 10, undefined);
      expect(result.children['key'].javascript_value).toBe(123);
      expect(result.children['key'].meta.parsed_type).toBe('number');
    });

    it('should parse float strings to numbers', () => {
      const result = parseRecursive({ key: '3.14159' }, 10, undefined);
      expect(result.children['key'].javascript_value).toBeCloseTo(3.14159);
      expect(result.children['key'].meta.parsed_type).toBe('number');
    });

    it('should NOT parse strings that start with number but have text', () => {
      const result = parseRecursive({ key: '123abc' }, 10, undefined);
      expect(result.children['key'].meta.parsed_type).toBe('string');
    });

    it('should handle empty string', () => {
      const result = parseRecursive({ key: '' }, 10, undefined);
      expect(result.children['key'].javascript_value).toBe('');
      expect(result.children['key'].meta.parsed_type).toBe('string');
    });
  });

  describe('URL Parsing', () => {
    it('should detect and parse valid URLs', () => {
      const result = parseRecursive({ key: 'https://example.com/path' }, 10, undefined);
      expect(result.children['key'].meta.parsed_type).toBe('url');
    });

    it('should expand URL into hash, host, pathname, etc.', () => {
      const result = parseRecursive({ key: 'https://example.com:8080/path?foo=bar#section' }, 10, undefined);
      const urlNode = result.children['key'];
      expect(urlNode.children['host'].javascript_value).toBe('example.com:8080');
      expect(urlNode.children['pathname'].javascript_value).toBe('/path');
      expect(urlNode.children['hash'].javascript_value).toBe('#section');
    });

    it('should parse query parameters into object', () => {
      const result = parseRecursive({ key: 'https://example.com?foo=bar&baz=qux' }, 10, undefined);
      const queryNode = result.children['key'].children['query'];
      expect(queryNode.children['foo'].javascript_value).toBe('bar');
      expect(queryNode.children['baz'].javascript_value).toBe('qux');
    });
  });

  describe('Search Text Filtering', () => {
    it('should mark nodes as satisfy_search when searchText is undefined', () => {
      const result = parseRecursive({ key: 'value' }, 10, undefined);
      expect(result.children['key'].meta.satisfy_search).toBe(true);
    });

    it('should mark nodes as satisfy_search when searchText is empty', () => {
      const result = parseRecursive({ key: 'value' }, 10, '');
      expect(result.children['key'].meta.satisfy_search).toBe(true);
    });

    it('should match search text case-insensitively', () => {
      const result = parseRecursive({ key: 'VALUE' }, 10, 'value');
      expect(result.children['key'].meta.satisfy_search).toBe(true);
    });

    it('should match in keys', () => {
      const result = parseRecursive({ testKey: 'something' }, 10, 'testkey');
      expect(result.children['testKey'].meta.satisfy_search).toBe(true);
    });

    it('should propagate satisfy_search from child to parent', () => {
      const result = parseRecursive({ parent: { child: 'searchme' } }, 10, 'searchme');
      expect(result.children['parent'].meta.satisfy_search).toBe(true);
    });

    it('should mark nodes that do not match as not satisfying search', () => {
      const result = parseRecursive({ key: 'value' }, 10, 'notfound');
      expect(result.children['key'].meta.satisfy_search).toBe(false);
    });
  });

  describe('Depth Limiting', () => {
    it('should respect max_depth and stop recursion', () => {
      const deepObject = { level1: { level2: { level3: 'deep' } } };
      const result = parseRecursive(deepObject, 2, undefined);
      expect(result.children['level1'].children['level2']).toBeDefined();
      expect(Object.keys(result.children['level1'].children['level2'].children).length).toBe(0);
    });

    it('should not populate children beyond max_depth', () => {
      const result = parseRecursive({ key: 'value' }, 0, undefined);
      expect(Object.keys(result.children).length).toBe(0);
    });
  });

  describe('Tree Structure', () => {
    it('should set parent references correctly', () => {
      const result = parseRecursive({ key: 'value' }, 10, undefined);
      expect(result.children['key'].parent).toBe(result);
    });

    it('should set key correctly for each node', () => {
      const result = parseRecursive({ myKey: 'value' }, 10, undefined);
      expect(result.children['myKey'].key).toBe('myKey');
    });

    it('should set children_count correctly', () => {
      const result = parseRecursive({ a: 1, b: 2, c: 3 }, 10, undefined);
      expect(result.meta.children_count).toBe(3);
    });

    it('should assign unique ids to each node', () => {
      const result = parseRecursive({ a: { b: 'c' } }, 10, undefined);
      const ids = new Set<number>();
      const collectIds = (node: TreeNode) => {
        ids.add(node.meta.id);
        Object.values(node.children).forEach(collectIds);
      };
      collectIds(result);
      expect(ids.size).toBe(3); // root, a, b
    });
  });
});
