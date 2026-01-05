import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { TooltipProvider } from '@extension/ui';
import { StorageTreeProvider } from '../context-storage';
import { SelectedTreeProvider } from '../context-selected-node';
import { StorageTypeProvider } from '../storage-type';
import { BookmarkProvider } from '../context-bookmarks';
import { ToastProvider } from '../context-toast';
import type { TreeNode } from '../storage';

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Props for customizing provider state
export interface WrapperProps {
  children: ReactNode;
}

// All providers wrapper - mirrors Popup.tsx structure
export function AllProviders({ children }: WrapperProps): ReactElement {
  return (
    <TooltipProvider delayDuration={0}>
      <ToastProvider>
        <StorageTreeProvider>
          <SelectedTreeProvider>
            <StorageTypeProvider>
              <BookmarkProvider>{children}</BookmarkProvider>
            </StorageTypeProvider>
          </SelectedTreeProvider>
        </StorageTreeProvider>
      </ToastProvider>
    </TooltipProvider>
  );
}

// Custom render with all providers
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Utility to create mock TreeNode for testing
export function createMockTreeNode(overrides?: Partial<TreeNode>): TreeNode {
  return {
    javascript_value: 'test-value',
    clipboard_value: 'test-value',
    children: {},
    parent: undefined,
    key: 'test-key',
    meta: {
      raw_type: 'string',
      parsed_type: 'string',
      depth: 0,
      satisfy_search: true,
      id: 1,
      children_count: 0,
    },
    ...overrides,
  };
}

// Create a tree with nested children for testing TreeNode component
export function createNestedMockTree(): TreeNode {
  const root = createMockTreeNode({
    key: undefined,
    javascript_value: {},
    meta: {
      raw_type: 'object',
      parsed_type: 'object',
      depth: 0,
      satisfy_search: true,
      id: 1,
      children_count: 2,
    },
  });

  const child1 = createMockTreeNode({
    key: 'child1',
    parent: root,
    javascript_value: {},
    meta: {
      raw_type: 'object',
      parsed_type: 'object',
      depth: 1,
      satisfy_search: true,
      id: 2,
      children_count: 1,
    },
  });

  const child2 = createMockTreeNode({
    key: 'child2',
    parent: root,
    meta: {
      raw_type: 'string',
      parsed_type: 'string',
      depth: 1,
      satisfy_search: true,
      id: 3,
      children_count: 0,
    },
  });

  const grandchild = createMockTreeNode({
    key: 'grandchild',
    parent: child1,
    meta: {
      raw_type: 'string',
      parsed_type: 'string',
      depth: 2,
      satisfy_search: true,
      id: 4,
      children_count: 0,
    },
  });

  child1.children = { grandchild };
  root.children = { child1, child2 };

  return root;
}
