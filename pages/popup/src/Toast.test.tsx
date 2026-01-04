import { describe, it, expect } from 'vitest';
import { render, screen } from './test/test-utils';
import { Toast } from './Toast';

describe('Toast', () => {
  describe('Rendering', () => {
    it('renders with message when visible', () => {
      render(<Toast isVisible={true} message="Copied!" />);
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<Toast isVisible={true} message="Custom message" />);
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('has correct role for accessibility', () => {
      render(<Toast isVisible={true} message="Test" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live attribute for screen readers', () => {
      render(<Toast isVisible={true} message="Test" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Visibility', () => {
    it('has opacity-100 class when visible', () => {
      render(<Toast isVisible={true} message="Test" />);
      expect(screen.getByRole('status')).toHaveClass('opacity-100');
    });

    it('has opacity-0 class when not visible', () => {
      render(<Toast isVisible={false} message="Test" />);
      expect(screen.getByRole('status')).toHaveClass('opacity-0');
    });

    it('has pointer-events-none when not visible', () => {
      render(<Toast isVisible={false} message="Test" />);
      expect(screen.getByRole('status')).toHaveClass('pointer-events-none');
    });
  });
});
