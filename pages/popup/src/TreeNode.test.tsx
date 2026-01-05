import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent, waitFor, createMockTreeNode, createNestedMockTree } from './test/test-utils';
import { Tree } from './TreeNode';
import { BookmarkProvider } from './context-bookmarks';
import { TooltipProvider } from '@extension/ui';
import type { ReactNode } from 'react';

// Simple wrapper for TreeNode tests
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <BookmarkProvider>{children}</BookmarkProvider>
    </TooltipProvider>
  );
}

describe('Tree (TreeNode)', () => {
  const defaultProps = {
    k: 'test-key',
    node: createMockTreeNode(),
    onSelected: vi.fn(),
    pathIds: new Set<number>(),
    globalFolding: 0,
  };

  describe('Rendering', () => {
    it('renders node key text', () => {
      render(<Tree {...defaultProps} />, { wrapper: TestWrapper });
      expect(screen.getByText('test-key')).toBeInTheDocument();
    });

    it('renders nothing when node does not satisfy search', () => {
      const node = createMockTreeNode({
        meta: {
          ...createMockTreeNode().meta,
          satisfy_search: false,
        },
      });
      const { container } = render(<Tree {...defaultProps} node={node} />, { wrapper: TestWrapper });
      expect(container.firstChild).toBeNull();
    });

    it('renders bookmark icon', () => {
      render(<Tree {...defaultProps} />, { wrapper: TestWrapper });
      // Bookmark icon should be present (either filled or empty)
      const bookmarkButton = screen.getAllByRole('button')[1]; // Second button is bookmark
      expect(bookmarkButton).toBeInTheDocument();
    });
  });

  describe('Root Node Behavior', () => {
    it('does not render row for root node (k=undefined)', () => {
      const rootNode = createNestedMockTree();
      render(<Tree {...defaultProps} k={undefined} node={rootNode} />, { wrapper: TestWrapper });

      // Root node key should not be visible, but children should be
      expect(screen.queryByText('test-key')).not.toBeInTheDocument();
      expect(screen.getByText('child1')).toBeInTheDocument();
      expect(screen.getByText('child2')).toBeInTheDocument();
    });

    it('root is always expanded by default', () => {
      const rootNode = createNestedMockTree();
      render(<Tree {...defaultProps} k={undefined} node={rootNode} />, { wrapper: TestWrapper });

      // Children should be visible
      expect(screen.getByText('child1')).toBeInTheDocument();
      expect(screen.getByText('child2')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('is collapsed by default for non-root nodes', () => {
      const nodeWithChildren = createMockTreeNode({
        key: 'parent',
        children: {
          child: createMockTreeNode({ key: 'child' }),
        },
        meta: {
          ...createMockTreeNode().meta,
          children_count: 1,
        },
      });

      render(<Tree {...defaultProps} k="parent" node={nodeWithChildren} />, { wrapper: TestWrapper });

      // Parent should be visible
      expect(screen.getByText('parent')).toBeInTheDocument();
      // Child should not be visible (collapsed)
      expect(screen.queryByText('child')).not.toBeInTheDocument();
    });

    it('expands when node is clicked', async () => {
      const user = userEvent.setup();
      const childNode = createMockTreeNode({ key: 'child' });
      const nodeWithChildren = createMockTreeNode({
        key: 'parent',
        children: { child: childNode },
        meta: {
          ...createMockTreeNode().meta,
          children_count: 1,
        },
      });
      childNode.parent = nodeWithChildren;

      render(<Tree {...defaultProps} k="parent" node={nodeWithChildren} />, { wrapper: TestWrapper });

      // Click to expand
      const parentRow = screen.getByText('parent');
      await user.click(parentRow);

      // Child should now be visible
      await waitFor(() => {
        expect(screen.getByText('child')).toBeInTheDocument();
      });
    });

    it('calls onSelected with node when clicked', async () => {
      const user = userEvent.setup();
      const onSelected = vi.fn();
      const node = createMockTreeNode();

      render(<Tree {...defaultProps} onSelected={onSelected} node={node} />, { wrapper: TestWrapper });

      await user.click(screen.getByText('test-key'));

      expect(onSelected).toHaveBeenCalledWith(node);
    });
  });

  describe('Global Folding', () => {
    it('expands all when globalFolding > 0', async () => {
      const childNode = createMockTreeNode({ key: 'child' });
      const nodeWithChildren = createMockTreeNode({
        key: 'parent',
        children: { child: childNode },
        meta: {
          ...createMockTreeNode().meta,
          children_count: 1,
        },
      });
      childNode.parent = nodeWithChildren;

      const { rerender } = render(<Tree {...defaultProps} k="parent" node={nodeWithChildren} globalFolding={0} />, {
        wrapper: TestWrapper,
      });

      // Initially collapsed
      expect(screen.queryByText('child')).not.toBeInTheDocument();

      // Set globalFolding > 0 to expand
      rerender(<Tree {...defaultProps} k="parent" node={nodeWithChildren} globalFolding={1} />);

      await waitFor(() => {
        expect(screen.getByText('child')).toBeInTheDocument();
      });
    });

    it('collapses all when globalFolding < 0', async () => {
      const user = userEvent.setup();
      const childNode = createMockTreeNode({ key: 'child' });
      const nodeWithChildren = createMockTreeNode({
        key: 'parent',
        children: { child: childNode },
        meta: {
          ...createMockTreeNode().meta,
          children_count: 1,
        },
      });
      childNode.parent = nodeWithChildren;

      const { rerender } = render(<Tree {...defaultProps} k="parent" node={nodeWithChildren} globalFolding={0} />, {
        wrapper: TestWrapper,
      });

      // Expand first
      await user.click(screen.getByText('parent'));
      await waitFor(() => {
        expect(screen.getByText('child')).toBeInTheDocument();
      });

      // Set globalFolding < 0 to collapse
      rerender(<Tree {...defaultProps} k="parent" node={nodeWithChildren} globalFolding={-1} />);

      await waitFor(() => {
        expect(screen.queryByText('child')).not.toBeInTheDocument();
      });
    });
  });

  describe('Selection', () => {
    it('applies active styling when node id is in pathIds', () => {
      const node = createMockTreeNode({
        meta: {
          ...createMockTreeNode().meta,
          id: 42,
        },
      });
      const pathIds = new Set([42]);

      render(<Tree {...defaultProps} node={node} pathIds={pathIds} />, { wrapper: TestWrapper });

      // Find the node by its text, then check its parent row has active styling
      const nodeText = screen.getByText('test-key');
      // The row is the parent div with role="button"
      const nodeRow = nodeText.closest('[role="button"]');
      expect(nodeRow).toHaveClass('bg-accent/80');
    });
  });

  describe('Bookmarking', () => {
    it('prompts for name when bookmark icon clicked on non-bookmarked node', async () => {
      const user = userEvent.setup();
      vi.mocked(window.prompt).mockReturnValue('My Bookmark');

      render(<Tree {...defaultProps} />, { wrapper: TestWrapper });

      // Find and click bookmark button (second button in the row)
      const buttons = screen.getAllByRole('button');
      const bookmarkButton = buttons[1];
      await user.click(bookmarkButton);

      expect(window.prompt).toHaveBeenCalledWith('Name for this bookmark', 'test-key');
    });

    it('does not set bookmark when prompt is cancelled', async () => {
      const user = userEvent.setup();
      vi.mocked(window.prompt).mockReturnValue(null);

      render(<Tree {...defaultProps} />, { wrapper: TestWrapper });

      const buttons = screen.getAllByRole('button');
      const bookmarkButton = buttons[1];
      await user.click(bookmarkButton);

      // Should have been called but no error
      expect(window.prompt).toHaveBeenCalled();
    });
  });

  describe('Recursive Rendering', () => {
    it('renders child nodes when expanded', async () => {
      const user = userEvent.setup();
      const grandchild = createMockTreeNode({ key: 'grandchild' });
      const child = createMockTreeNode({
        key: 'child',
        children: { grandchild },
        meta: { ...createMockTreeNode().meta, children_count: 1, id: 2 },
      });
      grandchild.parent = child;

      const parent = createMockTreeNode({
        key: 'parent',
        children: { child },
        meta: { ...createMockTreeNode().meta, children_count: 1, id: 1 },
      });
      child.parent = parent;

      render(<Tree {...defaultProps} k="parent" node={parent} />, { wrapper: TestWrapper });

      // Expand parent
      await user.click(screen.getByText('parent'));
      await waitFor(() => {
        expect(screen.getByText('child')).toBeInTheDocument();
      });

      // Expand child
      await user.click(screen.getByText('child'));
      await waitFor(() => {
        expect(screen.getByText('grandchild')).toBeInTheDocument();
      });
    });
  });
});
