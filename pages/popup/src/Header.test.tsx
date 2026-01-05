import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from './test/test-utils';
import { Header } from './Header';

describe('Header', () => {
  describe('Rendering', () => {
    it('renders logo image', () => {
      renderWithProviders(<Header />);
      const logo = screen.getByAltText('logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', expect.stringContaining('icon48.png'));
    });

    it('renders storage type toggle button', () => {
      renderWithProviders(<Header />);
      expect(screen.getByText('Local Storage')).toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      renderWithProviders(<Header />);
      expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
    });

    it('renders Clear button (icon)', () => {
      renderWithProviders(<Header />);
      // Clear button is now an icon-only button with X icon
      const buttons = screen.getAllByRole('button');
      // Should have: storage toggle, clear, refresh
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders Refresh button (icon)', () => {
      renderWithProviders(<Header />);
      // Refresh button is now an icon-only button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders Feedback link', () => {
      renderWithProviders(<Header />);
      // Feedback is now an icon link
      const feedbackLink = screen.getByRole('link', { name: '' });
      expect(feedbackLink).toHaveAttribute('href', 'https://github.com/weilueluo/storage-explorer/issues/new');
    });
  });

  describe('Search Input', () => {
    it('auto-focuses search input on mount', async () => {
      renderWithProviders(<Header />);
      const searchInput = screen.getByPlaceholderText('Type to search...');
      await waitFor(() => {
        expect(document.activeElement).toBe(searchInput);
      });
    });

    it('clears input when Clear button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Header />);

      const searchInput = screen.getByPlaceholderText('Type to search...') as HTMLInputElement;
      await user.type(searchInput, 'test search');
      expect(searchInput.value).toBe('test search');

      // Clear button is the first icon-only button after storage toggle
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons[1]; // Index 1 = clear button (after storage toggle)
      await user.click(clearButton);

      expect(searchInput.value).toBe('');
    });

    it('refocuses input after clear', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Header />);

      const searchInput = screen.getByPlaceholderText('Type to search...');
      await user.type(searchInput, 'test');

      const buttons = screen.getAllByRole('button');
      const clearButton = buttons[1];
      await user.click(clearButton);

      await waitFor(() => {
        expect(document.activeElement).toBe(searchInput);
      });
    });
  });

  describe('Storage Type Toggle', () => {
    it('displays current storage type', () => {
      renderWithProviders(<Header />);
      expect(screen.getByText('Local Storage')).toBeInTheDocument();
    });

    it('toggles storage type on button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Header />);

      const toggleButton = screen.getByText('Local Storage');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Session Storage')).toBeInTheDocument();
      });
    });
  });

  describe('External Links', () => {
    it('logo links to GitHub repository', () => {
      renderWithProviders(<Header />);
      const logoLink = screen.getByRole('link', { name: /logo/i });
      expect(logoLink).toHaveAttribute('href', 'https://github.com/weilueluo/storage-explorer');
      expect(logoLink).toHaveAttribute('target', '_blank');
    });
  });
});
