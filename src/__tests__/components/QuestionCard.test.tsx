import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '@/components/quiz/QuestionCard';

const mockOptions = [
  { label: 'a', text: 'First option' },
  { label: 'b', text: 'Second option' },
  { label: 'c', text: 'Third option' },
  { label: 'd', text: 'Fourth option' },
];

const defaultProps = {
  questionNumber: 1,
  totalQuestions: 10,
  questionText: 'What is the correct answer?',
  options: mockOptions,
  selectedAnswer: null,
  onSelectAnswer: jest.fn(),
};

describe('QuestionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render question number and total', () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
    });

    it('should render question text', () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByText('What is the correct answer?')).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<QuestionCard {...defaultProps} />);

      mockOptions.forEach((option) => {
        expect(screen.getByText(option.text)).toBeInTheDocument();
      });
    });

    it('should render option labels', () => {
      render(<QuestionCard {...defaultProps} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });
  });

  describe('answer selection', () => {
    it('should call onSelectAnswer when option is clicked', () => {
      const onSelectAnswer = jest.fn();
      render(<QuestionCard {...defaultProps} onSelectAnswer={onSelectAnswer} />);

      fireEvent.click(screen.getByText('First option'));

      expect(onSelectAnswer).toHaveBeenCalledWith('a');
    });

    it('should highlight selected answer', () => {
      render(<QuestionCard {...defaultProps} selectedAnswer="b" />);

      const selectedButton = screen.getByText('Second option').closest('button');
      expect(selectedButton).toHaveClass('border-blue-500');
    });

    it('should not call onSelectAnswer when disabled', () => {
      const onSelectAnswer = jest.fn();
      render(
        <QuestionCard {...defaultProps} onSelectAnswer={onSelectAnswer} disabled />
      );

      fireEvent.click(screen.getByText('First option'));

      expect(onSelectAnswer).not.toHaveBeenCalled();
    });
  });

  describe('feedback mode', () => {
    it('should show correct answer with green styling', () => {
      render(
        <QuestionCard
          {...defaultProps}
          selectedAnswer="b"
          showFeedback
          correctAnswer="a"
        />
      );

      const correctButton = screen.getByText('First option').closest('button');
      expect(correctButton).toHaveClass('border-green-500');
    });

    it('should show incorrect selection with red styling', () => {
      render(
        <QuestionCard
          {...defaultProps}
          selectedAnswer="b"
          showFeedback
          correctAnswer="a"
        />
      );

      const incorrectButton = screen.getByText('Second option').closest('button');
      expect(incorrectButton).toHaveClass('border-red-500');
    });

    it('should show explanation when provided', () => {
      render(
        <QuestionCard
          {...defaultProps}
          selectedAnswer="a"
          showFeedback
          correctAnswer="a"
          explanation="This is the explanation"
        />
      );

      expect(screen.getByText('Explanation')).toBeInTheDocument();
      expect(screen.getByText('This is the explanation')).toBeInTheDocument();
    });

    it('should not show explanation when not in feedback mode', () => {
      render(
        <QuestionCard
          {...defaultProps}
          selectedAnswer="a"
          showFeedback={false}
          explanation="This is the explanation"
        />
      );

      expect(screen.queryByText('Explanation')).not.toBeInTheDocument();
    });

    it('should not call onSelectAnswer in feedback mode when disabled', () => {
      const onSelectAnswer = jest.fn();
      render(
        <QuestionCard
          {...defaultProps}
          onSelectAnswer={onSelectAnswer}
          selectedAnswer="a"
          showFeedback
          correctAnswer="a"
          disabled
        />
      );

      fireEvent.click(screen.getByText('Second option'));

      expect(onSelectAnswer).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have aria-pressed attribute on selected option', () => {
      render(<QuestionCard {...defaultProps} selectedAnswer="a" />);

      const selectedButton = screen.getByText('First option').closest('button');
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have aria-pressed false on unselected options', () => {
      render(<QuestionCard {...defaultProps} selectedAnswer="a" />);

      const unselectedButton = screen.getByText('Second option').closest('button');
      expect(unselectedButton).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
