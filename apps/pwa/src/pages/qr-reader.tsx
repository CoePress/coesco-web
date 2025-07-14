import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";

interface ScanResult {
  text: string;
  timestamp: Date;
}

const QRReader: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if QR scanning is supported
    QrScanner.hasCamera().then((hasCamera) => {
      if (!hasCamera) {
        setIsSupported(false);
        setError("No camera found on this device");
      }
    });

    return () => {
      // Cleanup on unmount
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setError("");

      // Initialize QR Scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          // Add new scan result
          const newResult: ScanResult = {
            text: result.data,
            timestamp: new Date(),
          };

          setScanResults((prev) => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results

          // Show success feedback (optional - you can remove this)
          console.log("QR Code scanned:", result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment", // Use back camera on mobile
          maxScansPerSecond: 3, // Reasonable scan rate
        }
      );

      await qrScannerRef.current.start();
      setIsRunning(true);
    } catch (err: any) {
      console.error("QR Scanner error:", err);
      setError(`Failed to start QR scanner: ${err.message || "Unknown error"}`);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsRunning(false);
  };

  const clearResults = () => {
    setScanResults([]);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log("Copied to clipboard:", text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const openLink = (text: string) => {
    try {
      // Check if it's a valid URL
      const url = new URL(text);
      window.open(url.href, "_blank");
    } catch (err) {
      // Not a valid URL, just copy to clipboard
      copyToClipboard(text);
    }
  };

  if (!isSupported) {
    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h1>QR Code Scanner</h1>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "8px",
            color: "#721c24",
            textAlign: "center",
          }}>
          <p>QR code scanning is not supported on this device.</p>
          <p>Please ensure you have a camera available.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>QR Code Scanner</h1>

      <div style={{ marginBottom: "20px" }}>
        {!isRunning ? (
          <button
            onClick={startScanning}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "10px",
            }}>
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "10px",
            }}>
            Stop Scanner
          </button>
        )}

        {scanResults.length > 0 && (
          <button
            onClick={clearResults}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}>
            Clear Results
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
          marginBottom: "20px",
        }}>
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "480px",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {isRunning && (
        <p style={{ marginBottom: "20px", color: "#28a745" }}>
          ✅ Scanner is active - point camera at a QR code
        </p>
      )}

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div
          style={{
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
          }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
            Scanned QR Codes ({scanResults.length})
          </h3>

          {scanResults.map((result, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                padding: "15px",
                marginBottom: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
              <div
                style={{
                  fontSize: "14px",
                  color: "#6c757d",
                  marginBottom: "8px",
                }}>
                {result.timestamp.toLocaleString()}
              </div>

              <div
                style={{
                  fontSize: "16px",
                  fontFamily: "monospace",
                  backgroundColor: "#f8f9fa",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef",
                  wordBreak: "break-all",
                  marginBottom: "10px",
                }}>
                {result.text}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => copyToClipboard(result.text)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}>
                  Copy
                </button>

                {result.text.match(/^https?:\/\//) && (
                  <button
                    onClick={() => openLink(result.text)}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}>
                    Open Link
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {scanResults.length === 0 && !isRunning && (
        <div
          style={{
            textAlign: "center",
            color: "#6c757d",
            fontStyle: "italic",
            padding: "40px",
          }}>
          Start the scanner to begin detecting QR codes
        </div>
      )}
    </div>
  );
};

export default QRReader;
