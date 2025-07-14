import { useState, useRef } from "react";

const QRReader: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "environment",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsRunning(true);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Camera Test</h1>

      <div style={{ marginBottom: "20px" }}>
        {!isRunning ? (
          <button
            onClick={startCamera}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}>
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}>
            Stop Camera
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
            color: "#721c24",
          }}>
          {error}
        </div>
      )}

      <div
        style={{
          border: "2px solid #333",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#000",
          width: "100%",
          maxWidth: "640px",
        }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "480px",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {isRunning && (
        <p style={{ marginTop: "10px", color: "#28a745" }}>
          ✅ Camera is working!
        </p>
      )}
    </div>
  );
};

export default QRReader;
