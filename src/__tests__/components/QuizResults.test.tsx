import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizResults } from '@/components/quiz/QuizResults';

const defaultProps = {
  totalQuestions: 10,
  correctCount: 7,
  score: 70,
  timeSpent: 300,
  byDomain: {
    'professional-orientation': { total: 5, correct: 4, percentage: 80 },
    'social-cultural-diversity': { total: 5, correct: 3, percentage: 60 },
  },
  mode: 'practice',
};

describe('QuizResults', () => {
  describe('score display', () => {
    it('should display the score percentage', () => {
      render(<QuizResults {...defaultProps} />);

      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('should display correct count and total', () => {
      render(<QuizResults {...defaultProps} />);

      expect(screen.getByText('7 of 10 correct')).toBeInTheDocument();
    });

    it('should show green color for high scores (>=80%)', () => {
      render(<QuizResults {...defaultProps} score={85} />);

      const scoreElement = screen.getByText('85%');
      expect(scoreElement).toHaveClass('text-green-600');
    });

    it('should show yellow color for medium scores (60-79%)', () => {
      render(<QuizResults {...defaultProps} score={70} />);

      const scoreElement = screen.getByText('70%');
      expect(scoreElement).toHaveClass('text-yellow-600');
    });

    it('should show red color for low scores (<60%)', () => {
      render(<QuizResults {...defaultProps} score={45} />);

      const scoreElement = screen.getByText('45%');
      expect(scoreElement).toHaveClass('text-red-600');
    });
  });

  describe('time display', () => {
    it('should display time spent in readable format', () => {
      render(<QuizResults {...defaultProps} timeSpent={300} />);

      expect(screen.getByText('Completed in 5m 0s')).toBeInTheDocument();
    });

    it('should handle hours correctly', () => {
      render(<QuizResults {...defaultProps} timeSpent={3700} />);

      expect(screen.getByText('Completed in 1h 1m 40s')).toBeInTheDocument();
    });

    it('should not display time when null', () => {
      render(<QuizResults {...defaultProps} timeSpent={null} />);

      expect(screen.queryByText(/Completed in/)).not.toBeInTheDocument();
    });
  });

  describe('domain breakdown', () => {
    it('should display domain names', () => {
      render(<QuizResults {...defaultProps} />);

      expect(screen.getByText('Professional Orientation')).toBeInTheDocument();
      expect(screen.getByText('Diversity')).toBeInTheDocument();
    });

    it('should display domain scores', () => {
      render(<QuizResults {...defaultProps} />);

      expect(screen.getByText('4/5 (80%)')).toBeInTheDocument();
      expect(screen.getByText('3/5 (60%)')).toBeInTheDocument();
    });

    it('should not show domain breakdown when empty', () => {
      render(<QuizResults {...defaultProps} byDomain={{}} />);

      expect(screen.queryByText('Performance by Domain')).not.toBeInTheDocument();
    });
  });

  describe('message display', () => {
    it('should show encouraging message for passing score', () => {
      render(<QuizResults {...defaultProps} score={70} />);

      expect(screen.getByText('Great Work!')).toBeInTheDocument();
    });

    it('should show motivating message for failing score', () => {
      render(<QuizResults {...defaultProps} score={50} />);

      expect(screen.getByText('Keep Practicing!')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should call onRetry when Try Again is clicked', () => {
      const onRetry = jest.fn();
      render(<QuizResults {...defaultProps} onRetry={onRetry} />);

      fireEvent.click(screen.getByText('Try Again'));

      expect(onRetry).toHaveBeenCalled();
    });

    it('should call onReview when Review Answers is clicked', () => {
      const onReview = jest.fn();
      render(<QuizResults {...defaultProps} onReview={onReview} />);

      fireEvent.click(screen.getByText('Review Answers'));

      expect(onReview).toHaveBeenCalled();
    });

    it('should have Back to Home link', () => {
      render(<QuizResults {...defaultProps} />);

      const homeLink = screen.getByText('Back to Home');
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('should not show Review Answers when onReview not provided', () => {
      render(<QuizResults {...defaultProps} onReview={undefined} />);

      expect(screen.queryByText('Review Answers')).not.toBeInTheDocument();
    });

    it('should not show Try Again when onRetry not provided', () => {
      render(<QuizResults {...defaultProps} onRetry={undefined} />);

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });
});
