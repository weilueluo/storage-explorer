import { describe, it, expect } from 'vitest';
import { getPathFromLeaf, getRecursive } from './bookmark-utils';
import type { TreeNode, TreeNodeMetadata } from './storage';

// Helper function to create a mock TreeNode
function createMockNode(
  key: string | undefined,
  value: unknown = 'test',
  parent: TreeNode | undefined = undefined,
  children: { [key: string]: TreeNode } = {},
): TreeNode {
  const meta: TreeNodeMetadata = {
    raw_type: 'string',
    parsed_type: 'string',
    depth: parent ? parent.meta.depth + 1 : 0,
    satisfy_search: true,
    id: Math.floor(Math.random() * 1000),
    children_count: Object.keys(children).length,
  };
  return {
    javascript_value: value,
    clipboard_value: String(value),
    children,
    parent,
    key,
    meta,
  };
}

// Helper to build a simple tree
function buildTree(): { root: TreeNode; level1: TreeNode; level2: TreeNode; level3: TreeNode } {
  const root = createMockNode(undefined);
  const level1 = createMockNode('level1', 'value1', root);
  const level2 = createMockNode('level2', 'value2', level1);
  const level3 = createMockNode('level3', 'value3', level2);

  level2.children['level3'] = level3;
  level1.children['level2'] = level2;
  root.children['level1'] = level1;

  return { root, level1, level2, level3 };
}

describe('getPathFromLeaf', () => {
  it('should return empty array for root node', () => {
    const root = createMockNode(undefined);
    const path = getPathFromLeaf(root);
    expect(path).toEqual([]);
  });

  it('should return single-element array for direct child of root', () => {
    const root = createMockNode(undefined);
    const child = createMockNode('child', 'value', root);
    root.children['child'] = child;

    const path = getPathFromLeaf(child);
    expect(path.length).toBe(1);
    expect(path[0]).toBe(child);
  });

  it('should return path from leaf to root, reversed', () => {
    const { level1, level2, level3 } = buildTree();

    const path = getPathFromLeaf(level3);
    expect(path.length).toBe(3);
    expect(path[0]).toBe(level1);
    expect(path[1]).toBe(level2);
    expect(path[2]).toBe(level3);
  });

  it('should exclude root node from path', () => {
    const { root, level3 } = buildTree();

    const path = getPathFromLeaf(level3);
    expect(path.includes(root)).toBe(false);
  });
});

describe('getRecursive', () => {
  it('should return tree when path is empty', () => {
    const node = createMockNode('test');
    const result = getRecursive(node, []);
    expect(result).toBe(node);
  });

  it('should return undefined when path[0] does not match tree.key', () => {
    const node = createMockNode('test');
    const result = getRecursive(node, ['different']);
    expect(result).toBeUndefined();
  });

  it('should find node at single-element path', () => {
    const root = createMockNode(undefined);
    const child = createMockNode('child', 'value', root);
    root.children['child'] = child;

    const result = getRecursive(child, ['child']);
    expect(result).toBe(child);
  });

  it('should find node at multi-element path', () => {
    const { level1, level3 } = buildTree();

    const result = getRecursive(level1, ['level1', 'level2', 'level3']);
    expect(result).toBe(level3);
  });

  it('should return undefined when node not found', () => {
    const { level1 } = buildTree();

    const result = getRecursive(level1, ['level1', 'level2', 'nonexistent']);
    expect(result).toBeUndefined();
  });

  it('should handle trees with multiple children per level', () => {
    const root = createMockNode(undefined);
    const childA = createMockNode('childA', 'valueA', root);
    const childB = createMockNode('childB', 'valueB', root);
    const grandchild = createMockNode('grandchild', 'grandvalue', childB);

    childB.children['grandchild'] = grandchild;
    root.children['childA'] = childA;
    root.children['childB'] = childB;

    const result = getRecursive(childB, ['childB', 'grandchild']);
    expect(result).toBe(grandchild);
  });
});
