'use client';

interface AIToggleProps {
  useAI: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function AIToggle({ useAI, onToggle, disabled }: AIToggleProps) {
  return (
    <div className="flex items-center space-x-2 sm:space-x-3">
      <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Analysis Mode:</span>
      <button
        onClick={() => onToggle(!useAI)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          useAI ? 'bg-blue-600' : 'bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
            useAI ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <span className={`text-xs sm:text-sm ${!useAI ? 'text-white' : 'text-gray-400'}`}>
          <span className="hidden sm:inline">Rule-based</span>
          <span className="inline sm:hidden">Rule</span>
        </span>
        <span className="text-gray-500 text-xs sm:text-sm">|</span>
        <span className={`text-xs sm:text-sm ${useAI ? 'text-white' : 'text-gray-400'} flex items-center`}>
          <span className="hidden sm:inline">🤖 AI Analysis</span>
          <span className="inline sm:hidden">🤖 AI</span>
        </span>
      </div>
    </div>
  );
}