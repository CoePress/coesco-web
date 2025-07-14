import { useState, useRef, useEffect, useCallback } from "react";

interface QRReaderProps {}

interface ScanResult {
  data: string;
  timestamp: Date;
}

const QRReader: React.FC<QRReaderProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  // Check for BarcodeDetector support
  useEffect(() => {
    const checkSupport = async () => {
      const isDetectorSupported = "BarcodeDetector" in window;
      const isCameraSupported =
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;

      setIsSupported(isDetectorSupported && isCameraSupported);

      if (isDetectorSupported) {
        try {
          detectorRef.current = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
        } catch (err) {
          console.warn("BarcodeDetector initialization failed:", err);
          setIsSupported(false);
        }
      }
    };

    checkSupport();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsScanning(false);
  }, []);

  const detectQRCode = useCallback(async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !detectorRef.current ||
      !isScanning
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(detectQRCode);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const barcodes = await detectorRef.current.detect(canvas);

      if (barcodes.length > 0) {
        const qrCode = barcodes.find(
          (barcode: any) => barcode.format === "qr_code"
        );
        if (qrCode) {
          setScanResult({
            data: qrCode.rawValue,
            timestamp: new Date(),
          });
          stopCamera();
          return;
        }
      }
    } catch (err) {
      console.warn("QR detection error:", err);
    }

    // Continue scanning
    if (isScanning) {
      animationRef.current = requestAnimationFrame(detectQRCode);
    }
  }, [isScanning, stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      setError("");

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);

        // Start QR detection
        if (detectorRef.current) {
          animationRef.current = requestAnimationFrame(detectQRCode);
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);

      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Please allow camera access and try again."
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else if (err.name === "NotSupportedError") {
        setError("Camera not supported in this browser.");
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [facingMode, detectQRCode]);

  const handleScanAgain = () => {
    setScanResult(null);
    startCamera();
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto-start camera when facingMode changes
  useEffect(() => {
    if (hasPermission && !scanResult) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [facingMode, hasPermission, scanResult, startCamera]);

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            QR Scanner Not Supported
          </h3>
          <p className="text-gray-600 text-sm max-w-sm">
            Your browser doesn't support the BarcodeDetector API required for QR
            scanning. Please try using a modern browser like Chrome, Edge, or
            Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">QR Scanner</h2>
            <p className="text-sm text-gray-600">
              Scan QR codes with your camera
            </p>
          </div>

          {isScanning && (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleCamera}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title={`Switch to ${facingMode === "user" ? "back" : "front"} camera`}>
                <span className="text-lg">🔄</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        {scanResult ? (
          // Scan Result
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-green-600 text-2xl">✅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  QR Code Scanned!
                </h3>
                <p className="text-sm text-gray-500">
                  Scanned on {scanResult.timestamp.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Content:
                </h4>
                <p className="text-gray-900 break-all font-mono text-sm">
                  {scanResult.data}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleScanAgain}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Scan Another
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(scanResult.data);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Camera View
          <div className="relative h-full">
            {!isScanning && hasPermission === null && (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-blue-600 text-2xl">📷</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Scan
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-sm">
                    Click the button below to start your camera and scan QR
                    codes
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    Start Camera
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-red-600 text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Camera Access Error
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-sm">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="relative h-full">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Scanning Frame */}
                    <div className="w-64 h-64 border-4 border-white rounded-lg relative">
                      {/* Corner indicators */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                      {/* Scanning line animation */}
                      <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"></div>
                      </div>
                    </div>

                    <p className="text-white text-center mt-4 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                      Position QR code within the frame
                    </p>
                  </div>
                </div>

                {/* Hidden canvas for QR detection */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRReader;
