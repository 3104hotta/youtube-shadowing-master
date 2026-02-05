'use client';

interface ComparisonViewProps {
  originalText: string;
  recognizedText: string;
}

export function ComparisonView({ originalText, recognizedText }: ComparisonViewProps) {
  const calculateAccuracy = () => {
    if (!recognizedText) return 0;

    const originalWords = originalText.toLowerCase().split(/\s+/);
    const recognizedWords = recognizedText.toLowerCase().split(/\s+/);

    const matchedWords = originalWords.filter((word) =>
      recognizedWords.includes(word)
    );

    return Math.round((matchedWords.length / originalWords.length) * 100);
  };

  const accuracy = calculateAccuracy();

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Comparison</h3>
        <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Text</h4>
          <div className="p-3 bg-white border border-gray-300 rounded min-h-[100px]">
            {originalText || 'No subtitle selected'}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Speech</h4>
          <div className="p-3 bg-white border border-gray-300 rounded min-h-[100px]">
            {recognizedText || 'Start recording to see your speech'}
          </div>
        </div>
      </div>
    </div>
  );
}
