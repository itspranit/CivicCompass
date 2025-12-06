import React, { useState, useRef, useCallback } from 'react';
import CameraView, { CameraHandle } from './components/CameraView';
import MicButton from './components/MicButton';
import InfoOverlay from './components/InfoOverlay';
import { AppState, FormAnalysisResponse } from './types';
import { analyzeForm } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisData, setAnalysisData] = useState<FormAnalysisResponse | null>(null);
  const cameraRef = useRef<CameraHandle>(null);
  
  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize audio stream specifically for recording (separate from camera)
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      return true;
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please enable microphone access to use this app.");
      return false;
    }
  };

  const startRecording = useCallback(async () => {
    if (appState === AppState.PROCESSING) return;

    // Reset previous data
    setAnalysisData(null);
    audioChunksRef.current = [];

    // Ensure audio is ready
    if (!mediaRecorderRef.current) {
      const success = await initAudio();
      if (!success) return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start();
      setAppState(AppState.RECORDING);
    }
  }, [appState]);

  const stopRecording = useCallback(async () => {
    if (appState !== AppState.RECORDING || !mediaRecorderRef.current) return;

    // Stop recorder
    mediaRecorderRef.current.stop();
    setAppState(AppState.PROCESSING);

    // Capture Image immediately
    const imageBase64 = cameraRef.current?.captureFrame();

    // Wait briefly for audio blob to finalize
    await new Promise(resolve => setTimeout(resolve, 200));

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Convert Blob to Base64 for Gemini
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const rawBase64Audio = base64Audio.split(',')[1]; // Remove data URL prefix
      
      if (imageBase64 && rawBase64Audio) {
        try {
          const result = await analyzeForm(imageBase64, rawBase64Audio);
          setAnalysisData(result);
          setAppState(AppState.RESULT);
        } catch (error) {
          console.error("Analysis failed", error);
          setAppState(AppState.ERROR);
          // Auto reset error after 3s
          setTimeout(() => setAppState(AppState.IDLE), 3000);
        }
      } else {
        console.error("Missing image or audio data");
        setAppState(AppState.ERROR);
        setTimeout(() => setAppState(AppState.IDLE), 3000);
      }
    };
  }, [appState]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans">
      {/* Viewfinder Layer */}
      <CameraView 
        ref={cameraRef} 
        boundingBox={analysisData?.form_field_coordinates || null} 
      />

      {/* UI Layer */}
      <InfoOverlay appState={appState} data={analysisData} />
      
      <MicButton 
        appState={appState} 
        onStartRecording={startRecording} 
        onStopRecording={stopRecording} 
      />

      {/* Error Toast */}
      {appState === AppState.ERROR && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-6 py-4 rounded-xl backdrop-blur-sm z-50">
          <p className="font-bold">Something went wrong.</p>
          <p className="text-sm">Please try asking again.</p>
        </div>
      )}
    </div>
  );
};

export default App;
