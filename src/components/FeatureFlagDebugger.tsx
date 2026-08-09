// Development component to debug and display feature flags
import { useState } from 'react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

export default function FeatureFlagDebugger() {
  const { flags } = useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development mode and if debug is enabled
  if (!import.meta.env.DEV || !flags.enableDebugMode) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        🚩 Feature Flags
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Feature Flags
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium text-gray-700 dark:text-gray-300">Feature</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Status</div>
            </div>
            
            {Object.entries(flags).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2 py-1 border-t border-gray-100 dark:border-gray-700">
                <div className="text-gray-600 dark:text-gray-400 text-xs">
                  {key.replace(/^enable/, '').replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    value 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {value ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Edit .env.local to change feature flags
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
