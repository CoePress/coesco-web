import { Eraser, PenTool, RotateCcw, Save, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

import Button from "./button";

interface SketchPadProps {
  formId: string;
  value?: string; // URL of saved sketch
  onChange: (sketchUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export const SketchPad: React.FC<SketchPadProps> = ({
  formId,
  value,
  onChange,
  disabled = false,
  className = "",
  width = 600,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSketch, setHasSketch] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [brushSize, setBrushSize] = useState(2);
  const [color, setColor] = useState("#000000");
  const [saving, setSaving] = useState(false);

  const { post } = useApi();
  const toast = useToast();

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
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing sketch if available
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSketch(true);
      };
      img.src = value;
    }
  }, [width, height, value]);

  useEffect(() => {
    if (isModalOpen) {
      // Small delay to ensure canvas is rendered
      setTimeout(setupCanvas, 100);
    }
  }, [isModalOpen, setupCanvas]);

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas)
      return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    else {
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

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 2;
    }
    else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

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
    setHasSketch(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSketch = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas)
      return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSketch(false);
  };

  const saveSketch = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSketch)
      return;

    setSaving(true);

    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to create sketch data");
          setSaving(false);
          return;
        }

        const formData = new FormData();
        formData.append("files", blob, `sketch-${Date.now()}.png`);
        formData.append("tags", JSON.stringify([`form:${formId}`, "form-submission", "sketch"]));
        formData.append("isPublic", "false");
        formData.append("generateThumbnail", "false");

        const response = await post(`/assets/upload-multiple`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response?.assets && response.assets.length > 0) {
          const uploadedAsset = response.assets[0];
          const sketchUrl = uploadedAsset.cdnUrl || uploadedAsset.url;
          onChange(sketchUrl);
          setIsModalOpen(false);
          toast.success("Sketch saved successfully");
        }
        else {
          toast.error(response?.error || "Failed to save sketch");
        }
      }, "image/png");
    }
    catch (error) {
      console.error("Sketch save error:", error);
      toast.error("Failed to save sketch");
    }
    finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#800000",
    "#808080",
  ];

  return (
    <>
      {/* Trigger button */}
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className={`w-full border-2 border-dashed rounded-sm p-8 text-center transition-colors cursor-pointer ${
            hasSketch || value
              ? "border-success bg-success/5"
              : "border-border hover:border-primary/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {hasSketch || value
            ? (
                <div className="flex flex-col items-center gap-2">
                  <PenTool className="text-success" size={32} />
                  <p className="text-success font-medium">Sketch saved</p>
                  <p className="text-xs text-text-muted">Click to edit sketch</p>
                </div>
              )
            : (
                <div className="flex flex-col items-center gap-2">
                  <PenTool className="text-text-muted" size={32} />
                  <p className="text-text-muted">Click to create sketch</p>
                  <p className="text-xs text-text-muted">Draw or markup images</p>
                </div>
              )}
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text">Sketch Pad</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-4 p-4 border-b border-border bg-background">
              <div className="flex items-center gap-2">
                <Button
                  variant={tool === "pen" ? "primary" : "secondary-outline"}
                  size="sm"
                  onClick={() => setTool("pen")}
                >
                  <PenTool size={16} />
                </Button>
                <Button
                  variant={tool === "eraser" ? "primary" : "secondary-outline"}
                  size="sm"
                  onClick={() => setTool("eraser")}
                >
                  <Eraser size={16} />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={e => setBrushSize(Number(e.target.value))}
                  className="w-16"
                />
                <div
                  className="border border-border rounded-full bg-text"
                  style={{
                    width: Math.max(brushSize, 4),
                    height: Math.max(brushSize, 4),
                  }}
                />
              </div>

              {tool === "pen" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted">Color:</span>
                  <div className="flex gap-1">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded border-2 ${
                          color === c ? "border-text" : "border-border"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 overflow-auto">
              <div className="border border-border rounded-sm bg-white inline-block">
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
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="secondary-outline"
                onClick={clearSketch}
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
                  onClick={saveSketch}
                  disabled={!hasSketch || saving}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Sketch"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
