'use client';

import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface RecordButtonProps {
  onTranscript: (text: string) => void;
}

export function RecordButton({ onTranscript }: RecordButtonProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition();

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        onTranscript(transcript);
      }
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-red-600">
        Speech recognition is not supported in this browser. Please use Chrome or
        Edge.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleToggle}
        className={`p-6 rounded-full transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? <MicOff size={32} /> : <Mic size={32} />}
      </button>
      <span className="text-sm text-gray-600">
        {isListening ? 'Recording...' : 'Click to record'}
      </span>
    </div>
  );
}
