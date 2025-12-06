import React from 'react';
import { AppState } from '../types';

interface MicButtonProps {
  appState: AppState;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ appState, onStartRecording, onStopRecording }) => {
  const isRecording = appState === AppState.RECORDING;
  const isProcessing = appState === AppState.PROCESSING;

  return (
    <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center items-center">
      <button
        onMouseDown={onStartRecording}
        onMouseUp={onStopRecording}
        onTouchStart={onStartRecording}
        onTouchEnd={(e) => {
           e.preventDefault(); // Prevent ghost clicks
           onStopRecording();
        }}
        disabled={isProcessing}
        className={`
          relative group transition-all duration-200
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer active:scale-95'}
        `}
        aria-label="Record question"
      >
        {/* Pulsing ring when recording */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
        )}
        
        {/* Main Button Circle */}
        <div className={`
          relative flex items-center justify-center w-20 h-20 rounded-full shadow-xl border-4
          ${isRecording 
            ? 'bg-red-600 border-red-200 scale-110' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
          }
          transition-all duration-300
        `}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-slate-800'}`}
          >
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          </svg>
        </div>

        {/* Helper text if idle */}
        {!isRecording && !isProcessing && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-xs px-2 py-1 rounded">
            Hold to Speak
          </div>
        )}
      </button>
    </div>
  );
};

export default MicButton;
