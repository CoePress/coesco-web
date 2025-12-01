import { Check, RotateCcw, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import Button from "./button";

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string | null) => void;
  disabled?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  width = 400,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasSignature(true);
        };
        img.src = value;
      }
    }
  }, [value]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing styles
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [width, height]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas)
      return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled)
      return;

    e.preventDefault();
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx)
      return;

    const pos = getEventPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled)
      return;

    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx)
      return;

    const pos = getEventPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature)
      return;

    const dataURL = canvas.toDataURL("image/png");
    onChange(dataURL);
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
    // Small delay to ensure canvas is rendered
    setTimeout(() => {
      setupCanvas();
      if (value) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasSignature(true);
          };
          img.src = value;
        }
      }
    }, 100);
  };

  return (
    <>
      {/* Trigger button */}
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className={`w-full border-2 border-dashed ${
            hasSignature || value
              ? "border-success bg-success/5"
              : "border-border hover:border-primary/50"
          } rounded-sm p-8 text-center transition-colors cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {hasSignature || value
            ? (
                <div className="flex flex-col items-center gap-2">
                  <Check className="text-success" size={32} />
                  <p className="text-success font-medium">Signature captured</p>
                  <p className="text-xs text-text-muted">Click to edit signature</p>
                </div>
              )
            : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-text-muted rounded border-dashed" />
                  <p className="text-text-muted">Click to add signature</p>
                  <p className="text-xs text-text-muted">Draw your signature</p>
                </div>
              )}
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text">Add Signature</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="border border-border rounded-sm bg-white">
                <canvas
                  ref={canvasRef}
                  width={width}
                  height={height}
                  className="block max-w-full h-auto cursor-crosshair touch-none"
                  style={{ width: "100%", height: "auto" }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="secondary-outline"
                  onClick={clearSignature}
                  className="flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Clear
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="secondary-outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveSignature}
                    disabled={!hasSignature}
                  >
                    Save Signature
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
