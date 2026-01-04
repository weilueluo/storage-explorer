import { describe, it, expect, vi } from 'vitest';
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
      expect(screen.getByPlaceholderText('type to search...')).toBeInTheDocument();
    });

    it('renders Clear button', () => {
      renderWithProviders(<Header />);
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('renders Refresh button', () => {
      renderWithProviders(<Header />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('renders Feedback link', () => {
      renderWithProviders(<Header />);
      const feedbackLink = screen.getByText('Feedback');
      expect(feedbackLink).toBeInTheDocument();
      expect(feedbackLink).toHaveAttribute('href', 'https://github.com/weilueluo/storage-explorer/issues/new');
    });
  });

  describe('Search Input', () => {
    it('auto-focuses search input on mount', async () => {
      renderWithProviders(<Header />);
      const searchInput = screen.getByPlaceholderText('type to search...');
      await waitFor(() => {
        expect(document.activeElement).toBe(searchInput);
      });
    });

    it('clears input when Clear button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Header />);

      const searchInput = screen.getByPlaceholderText('type to search...') as HTMLInputElement;
      await user.type(searchInput, 'test search');
      expect(searchInput.value).toBe('test search');

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(searchInput.value).toBe('');
    });

    it('refocuses input after clear', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Header />);

      const searchInput = screen.getByPlaceholderText('type to search...');
      await user.type(searchInput, 'test');

      const clearButton = screen.getByText('Clear');
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
