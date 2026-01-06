import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from './test/test-utils';
import { Toast } from './Toast';

describe('Toast', () => {
  describe('Rendering', () => {
    it('renders with message', () => {
      render(<Toast id={1} message="Copied!" type="copied" isExiting={false} index={0} />);
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<Toast id={2} message="Custom message" type="copied" isExiting={false} index={0} />);
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('has correct role for accessibility', () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={0} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live attribute for screen readers', () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={0} />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Animation', () => {
    it('starts with opacity 0 before animation', () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={0} />);
      // Initially should have opacity 0 before animation triggers
      expect(screen.getByRole('status')).toHaveStyle({ opacity: '0' });
    });

    it('animates to full opacity after mount for index 0', async () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={0} />);
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveStyle({ opacity: '1' });
      });
    });

    it('has opacity 0 when isExiting is true', async () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={true} index={0} />);
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveStyle({ opacity: '0' });
      });
    });
  });

  describe('Paper Stack', () => {
    it('has full opacity for index 0 (top of stack)', async () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={0} />);
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveStyle({ opacity: '1' });
      });
    });

    it('has slightly reduced opacity for index 1', async () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={1} />);
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveStyle({ opacity: '0.85' });
      });
    });

    it('has reduced opacity for index 2', async () => {
      render(<Toast id={1} message="Test" type="copied" isExiting={false} index={2} />);
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveStyle({ opacity: '0.7' });
      });
    });
  });
});
