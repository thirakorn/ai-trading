'use client';

interface VolumeProfileToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function VolumeProfileToggle({ 
  enabled, 
  onToggle, 
  disabled = false 
}: VolumeProfileToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-400 font-medium">Volume Profile:</span>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
          ${enabled 
            ? 'bg-blue-600' 
            : 'bg-gray-600'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-opacity-80'
          }
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <span className={`text-xs font-medium ${enabled ? 'text-blue-400' : 'text-gray-500'}`}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}