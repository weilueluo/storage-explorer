import type { TreeNode } from './storage';

/**
 * Builds a path array from a leaf node to its root.
 * Returns the path in root-to-leaf order (reversed from traversal order).
 * Excludes the root node from the path.
 */
export function getPathFromLeaf(tree: TreeNode): TreeNode[] {
  const path: TreeNode[] = [];
  let head: TreeNode | undefined = tree;
  while (head !== undefined && head.parent !== undefined) {
    // skip root
    path.push(head);
    head = head.parent;
  }
  return path.reverse();
}

/**
 * Searches a tree for a node at a specific path.
 * Returns the node if found, undefined otherwise.
 *
 * @param tree - The tree node to start searching from
 * @param path - Array of keys representing the path to find
 */
export function getRecursive(tree: TreeNode, path: string[]): TreeNode | undefined {
  if (path.length === 0) {
    return tree;
  }
  if (path[0] === tree.key) {
    const childPath = path.slice(1);
    if (childPath.length === 0) {
      return tree;
    }
    if (tree.children) {
      for (const child of Object.values(tree.children)) {
        const node = getRecursive(child, childPath);
        if (node !== undefined) {
          return node;
        }
      }
    }
  }
  return undefined;
}
