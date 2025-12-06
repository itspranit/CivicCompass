import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface CameraViewProps {
  onStreamReady?: (stream: MediaStream) => void;
  boundingBox: [number, number, number, number] | null; // ymin, xmin, ymax, xmax
}

export interface CameraHandle {
  captureFrame: () => string | null;
}

const CameraView = forwardRef<CameraHandle, CameraViewProps>(({ onStreamReady, boundingBox }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current;
      if (!video) return null;

      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        // Get Base64 string without data prefix for Gemini
        const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.8);
        return dataUrl.split(',')[1]; 
      }
      return null;
    }
  }));

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false // We handle audio separately to control recording
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (onStreamReady) onStreamReady(stream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onStreamReady]);

  // Handle Canvas Drawing for Bounding Box
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !video) return;

    const draw = () => {
      if (video.readyState !== 4) {
        requestAnimationFrame(draw);
        return;
      }

      // Match canvas size to display size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (boundingBox && boundingBox.length === 4) {
        const [ymin, xmin, ymax, xmax] = boundingBox;
        
        const x = xmin * canvas.width;
        const y = ymin * canvas.height;
        const w = (xmax - xmin) * canvas.width;
        const h = (ymax - ymin) * canvas.height;

        // Draw Pulsing Box
        ctx.strokeStyle = '#4ade80'; // Tailwind green-400
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Add glow effect
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 20;

        ctx.strokeRect(x, y, w, h);

        // Draw Label Background
        const labelPadding = 8;
        const fontSize = 24;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const text = "Write Here";
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        const labelX = x + (w / 2) - (textWidth / 2);
        const labelY = y - 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        // RoundRect support varies, using fillRect for compatibility or standard roundRect
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(labelX - labelPadding, labelY - textHeight - labelPadding + 5, textWidth + (labelPadding * 2), textHeight + labelPadding, 8);
            ctx.fill();
        } else {
             ctx.fillRect(labelX - labelPadding, labelY - textHeight - labelPadding + 5, textWidth + (labelPadding * 2), textHeight + labelPadding);
        }

        // Draw Label Text
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0; // Remove shadow for text
        ctx.fillText(text, labelX, labelY);
      }
    };

    // If we have a bounding box, ensure we draw it. 
    // If null, we run once to clear.
    requestAnimationFrame(draw);

  }, [boundingBox]); // Re-run when boundingBox changes

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />
    </div>
  );
});

export default CameraView;
