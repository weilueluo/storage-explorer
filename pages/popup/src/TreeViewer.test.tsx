import { describe, it, expect } from 'vitest';
import React, { type ReactNode } from 'react';
import { render, screen, userEvent, waitFor, createMockTreeNode } from './test/test-utils';
import { TreeViewer } from './TreeViewer';
import { SelectedTreeProvider, useSelectedTree } from './context-selected-node';

// Wrapper that allows us to set initial selected tree
function createTestWrapper(selectedTree?: ReturnType<typeof createMockTreeNode>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SelectedTreeProvider>
        {selectedTree ? <SelectedTreeSetter tree={selectedTree}>{children}</SelectedTreeSetter> : children}
      </SelectedTreeProvider>
    );
  };
}

// Helper component to set the selected tree
function SelectedTreeSetter({ tree, children }: { tree: ReturnType<typeof createMockTreeNode>; children: ReactNode }) {
  const { setSelected } = useSelectedTree();
  // Use useEffect to avoid setState during render warning
  React.useEffect(() => {
    if (tree) {
      setSelected(tree);
    }
  }, [tree, setSelected]);
  return <>{children}</>;
}

describe('TreeViewer', () => {
  describe('Rendering', () => {
    it('renders Copy Key button', () => {
      render(<TreeViewer />, { wrapper: createTestWrapper() });
      expect(screen.getByText('Copy Key')).toBeInTheDocument();
    });

    it('renders Copy button', () => {
      render(<TreeViewer />, { wrapper: createTestWrapper() });
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('renders Copy Raw button', () => {
      render(<TreeViewer />, { wrapper: createTestWrapper() });
      expect(screen.getByText('Copy Raw')).toBeInTheDocument();
    });

    it('shows placeholder when no node selected', () => {
      render(<TreeViewer />, { wrapper: createTestWrapper() });
      expect(screen.getByText('~please select a node from the tree~')).toBeInTheDocument();
    });
  });

  describe('Copy Buttons', () => {
    it('Copy Key button is clickable when tree is selected', async () => {
      const mockTree = createMockTreeNode({ key: 'my-key' });
      const user = userEvent.setup();

      render(<TreeViewer />, { wrapper: createTestWrapper(mockTree) });

      await waitFor(() => {
        expect(screen.queryByText('~please select a node from the tree~')).not.toBeInTheDocument();
      });

      const copyKeyButton = screen.getByText('Copy Key');
      // Should not throw when clicked
      await user.click(copyKeyButton);
      expect(copyKeyButton).toBeInTheDocument();
    });

    it('Copy button is clickable when tree is selected', async () => {
      const mockTree = createMockTreeNode({
        key: 'test-key',
        javascript_value: { nested: 'value' },
      });
      const user = userEvent.setup();

      render(<TreeViewer />, { wrapper: createTestWrapper(mockTree) });

      await waitFor(() => {
        expect(screen.queryByText('~please select a node from the tree~')).not.toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /^Copy$/ });
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    it('Copy Raw button is clickable when tree is selected', async () => {
      const mockTree = createMockTreeNode({
        key: 'test-key',
        clipboard_value: '{"original":"json"}',
      });
      const user = userEvent.setup();

      render(<TreeViewer />, { wrapper: createTestWrapper(mockTree) });

      await waitFor(() => {
        expect(screen.queryByText('~please select a node from the tree~')).not.toBeInTheDocument();
      });

      const copyRawButton = screen.getByText('Copy Raw');
      await user.click(copyRawButton);
      expect(copyRawButton).toBeInTheDocument();
    });
  });

  describe('Selected Tree Display', () => {
    it('displays selected tree content', async () => {
      const mockTree = createMockTreeNode({
        key: 'test-key',
        javascript_value: { foo: 'bar' },
      });

      render(<TreeViewer />, { wrapper: createTestWrapper(mockTree) });

      await waitFor(() => {
        expect(screen.queryByText('~please select a node from the tree~')).not.toBeInTheDocument();
      });

      // The JSON should be displayed
      expect(screen.getByText(/"foo"/)).toBeInTheDocument();
    });
  });
});
