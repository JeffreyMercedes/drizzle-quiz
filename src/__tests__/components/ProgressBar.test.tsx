import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/quiz/ProgressBar';

describe('ProgressBar', () => {
  describe('rendering', () => {
    it('should render current and total count', () => {
      render(<ProgressBar current={5} total={10} />);

      expect(screen.getByText('5 of 10 completed')).toBeInTheDocument();
    });

    it('should render percentage when showPercentage is true', () => {
      render(<ProgressBar current={5} total={10} showPercentage />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should not render percentage when showPercentage is false', () => {
      render(<ProgressBar current={5} total={10} showPercentage={false} />);

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should have correct width style based on progress', () => {
      render(<ProgressBar current={3} total={10} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '30%' });
    });
  });

  describe('percentage calculation', () => {
    it('should calculate 0% when current is 0', () => {
      render(<ProgressBar current={0} total={10} showPercentage />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should calculate 100% when current equals total', () => {
      render(<ProgressBar current={10} total={10} showPercentage />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should round percentage to nearest integer', () => {
      render(<ProgressBar current={1} total={3} showPercentage />);

      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should handle total of 0', () => {
      render(<ProgressBar current={0} total={0} showPercentage />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have progressbar role', () => {
      render(<ProgressBar current={5} total={10} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(<ProgressBar current={5} total={10} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '5');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '10');
    });
  });
});
