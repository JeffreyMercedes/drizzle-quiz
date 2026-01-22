"use client";

interface QuestionCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
  options?: number[];
  maxAvailable?: number;
}

const DEFAULT_OPTIONS = [10, 20, 30, 50, 80, 100, 136, 160];

export function QuestionCountSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  maxAvailable,
}: QuestionCountSelectorProps) {
  // Filter options to only show those <= maxAvailable if provided
  const availableOptions = maxAvailable
    ? options.filter((opt) => opt <= maxAvailable)
    : options;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Number of Questions
      </label>
      <div className="flex flex-wrap gap-2">
        {availableOptions.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => onChange(count)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === count
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {count}
          </button>
        ))}
      </div>
      {maxAvailable && maxAvailable < Math.max(...options) && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {maxAvailable} questions available in this section
        </p>
      )}
    </div>
  );
}
