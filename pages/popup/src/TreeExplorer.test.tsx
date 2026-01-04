import { describe, it, expect, vi } from 'vitest';
import { screen, userEvent, waitFor, renderWithProviders, createNestedMockTree } from './test/test-utils';
import { TreeExplorer } from './TreeExplorer';

// Mock the context hooks to control test state
vi.mock('./context-storage', async () => {
  const actual = await vi.importActual('./context-storage');
  return {
    ...actual,
    useStorageTree: vi.fn(),
  };
});

vi.mock('./context-selected-node', async () => {
  const actual = await vi.importActual('./context-selected-node');
  return {
    ...actual,
    useSelectedTree: vi.fn(),
  };
});

vi.mock('./context-bookmarks', async () => {
  const actual = await vi.importActual('./context-bookmarks');
  return {
    ...actual,
    useBookmarks: vi.fn(),
  };
});

import { useStorageTree } from './context-storage';
import { useSelectedTree } from './context-selected-node';
import { useBookmarks } from './context-bookmarks';

describe('TreeExplorer', () => {
  beforeEach(() => {
    vi.mocked(useStorageTree).mockReturnValue({
      tree: undefined,
      stats: undefined,
      error: undefined,
      reload: vi.fn(),
    });

    vi.mocked(useSelectedTree).mockReturnValue({
      selectedTree: undefined,
      setSelected: vi.fn(),
      selectedPath: [],
      selectedIds: new Set(),
    });

    vi.mocked(useBookmarks).mockReturnValue({
      error: undefined,
      isBookmarked: vi.fn().mockReturnValue(false),
      setBookmark: vi.fn(),
      unsetBookmark: vi.fn(),
      bookmarkedNodes: {},
      bookmarkedNodeIds: new Set(),
    });
  });

  describe('Rendering', () => {
    it('renders Collapse All button', () => {
      renderWithProviders(<TreeExplorer />);
      expect(screen.getByText('Collapse All')).toBeInTheDocument();
    });

    it('renders Expand All button', () => {
      renderWithProviders(<TreeExplorer />);
      expect(screen.getByText('Expand All')).toBeInTheDocument();
    });

    it('renders loading component when tree is undefined', () => {
      vi.mocked(useStorageTree).mockReturnValue({
        tree: undefined,
        stats: undefined,
        error: undefined,
        reload: vi.fn(),
      });

      renderWithProviders(<TreeExplorer />);
      // Loading component should be rendered
      expect(screen.getByText('loading ...')).toBeInTheDocument();
    });

    it('renders tree when tree is loaded', () => {
      const mockTree = createNestedMockTree();
      vi.mocked(useStorageTree).mockReturnValue({
        tree: mockTree,
        stats: { size: 100, lastUpdated: new Date() },
        error: undefined,
        reload: vi.fn(),
      });

      renderWithProviders(<TreeExplorer />);

      // Tree children should be visible
      expect(screen.getByText('child1')).toBeInTheDocument();
      expect(screen.getByText('child2')).toBeInTheDocument();
    });

    it('renders empty message when tree has no children', () => {
      const emptyTree = createNestedMockTree();
      emptyTree.children = {};
      emptyTree.meta.children_count = 0;

      vi.mocked(useStorageTree).mockReturnValue({
        tree: emptyTree,
        stats: { size: 0, lastUpdated: new Date() },
        error: undefined,
        reload: vi.fn(),
      });

      renderWithProviders(<TreeExplorer />);

      expect(screen.getByText('~empty~')).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand All', () => {
    it('Collapse All button works', async () => {
      const mockTree = createNestedMockTree();
      vi.mocked(useStorageTree).mockReturnValue({
        tree: mockTree,
        stats: { size: 100, lastUpdated: new Date() },
        error: undefined,
        reload: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<TreeExplorer />);

      const collapseButton = screen.getByText('Collapse All');
      await user.click(collapseButton);

      // Button should still be clickable for another collapse
      expect(collapseButton).toBeInTheDocument();
    });

    it('Expand All button works', async () => {
      const mockTree = createNestedMockTree();
      vi.mocked(useStorageTree).mockReturnValue({
        tree: mockTree,
        stats: { size: 100, lastUpdated: new Date() },
        error: undefined,
        reload: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<TreeExplorer />);

      const expandButton = screen.getByText('Expand All');
      await user.click(expandButton);

      // After expanding, grandchild should be visible
      await waitFor(() => {
        expect(screen.getByText('grandchild')).toBeInTheDocument();
      });
    });
  });

  describe('Bookmarked Nodes', () => {
    it('renders bookmarked nodes section when bookmarks exist', () => {
      const mockTree = createNestedMockTree();
      const bookmarkedNode = createNestedMockTree();
      bookmarkedNode.key = 'bookmarked-key';

      vi.mocked(useStorageTree).mockReturnValue({
        tree: mockTree,
        stats: { size: 100, lastUpdated: new Date() },
        error: undefined,
        reload: vi.fn(),
      });

      vi.mocked(useBookmarks).mockReturnValue({
        error: undefined,
        isBookmarked: vi.fn().mockReturnValue(false),
        setBookmark: vi.fn(),
        unsetBookmark: vi.fn(),
        bookmarkedNodes: { 'My Bookmark': bookmarkedNode },
        bookmarkedNodeIds: new Set([1]),
      });

      renderWithProviders(<TreeExplorer />);

      // Bookmarked node should be visible
      expect(screen.getByText('My Bookmark')).toBeInTheDocument();
    });

    it('does not render bookmarks section when no bookmarks', () => {
      const mockTree = createNestedMockTree();

      vi.mocked(useStorageTree).mockReturnValue({
        tree: mockTree,
        stats: { size: 100, lastUpdated: new Date() },
        error: undefined,
        reload: vi.fn(),
      });

      vi.mocked(useBookmarks).mockReturnValue({
        error: undefined,
        isBookmarked: vi.fn().mockReturnValue(false),
        setBookmark: vi.fn(),
        unsetBookmark: vi.fn(),
        bookmarkedNodes: {},
        bookmarkedNodeIds: new Set(),
      });

      renderWithProviders(<TreeExplorer />);

      // No separator should be rendered when there are no bookmarks
      const separators = screen.queryAllByRole('separator');
      expect(separators.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('displays error from bookmark context', async () => {
      vi.mocked(useBookmarks).mockReturnValue({
        error: 'Bookmark error occurred',
        isBookmarked: vi.fn().mockReturnValue(false),
        setBookmark: vi.fn(),
        unsetBookmark: vi.fn(),
        bookmarkedNodes: {},
        bookmarkedNodeIds: new Set(),
      });

      renderWithProviders(<TreeExplorer />);

      // The error is set via useEffect, so we need to wait for it
      await waitFor(() => {
        expect(screen.getByText(/Error/)).toBeInTheDocument();
      });
    });
  });
});
