import React from 'react';
import { FormAnalysisResponse, AppState } from '../types';

interface InfoOverlayProps {
  appState: AppState;
  data: FormAnalysisResponse | null;
}

const InfoOverlay: React.FC<InfoOverlayProps> = ({ appState, data }) => {
  if (appState === AppState.IDLE) {
    return (
      <div className="absolute top-8 left-4 right-4 z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md text-white p-4 rounded-2xl border border-white/10 shadow-lg">
          <h1 className="text-xl font-bold mb-1">CivicCompass</h1>
          <p className="text-sm text-gray-300">
            Point at a form, hold the mic button, and ask a question.
          </p>
        </div>
      </div>
    );
  }

  if (appState === AppState.PROCESSING) {
    return (
      <div className="absolute top-8 left-4 right-4 z-20 flex justify-center pointer-events-none">
         <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/10 shadow-lg flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-medium">Analyzing form...</span>
         </div>
      </div>
    );
  }

  if (appState === AppState.RESULT && data) {
    return (
      <div className="absolute top-8 left-4 right-4 z-20 pointer-events-none transition-all duration-300 ease-in-out transform translate-y-0">
        <div className="bg-slate-900/90 backdrop-blur-lg text-white p-5 rounded-2xl border border-green-500/30 shadow-2xl">
          <div className="mb-2">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">AI Assistant</p>
            <p className="text-lg font-medium leading-snug">{data.native_language_response}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400">You asked: "{data.translated_user_intent}"</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InfoOverlay;
