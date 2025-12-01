import { useEffect, useRef, useState } from "react";

interface ScreenshotAnnotatorProps {
  screenshot: string;
  onAnnotatedScreenshot: (annotatedDataUrl: string) => void;
  clearTrigger?: number;
}

interface Rectangle {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

function ScreenshotAnnotator({ screenshot, onAnnotatedScreenshot, clearTrigger }: ScreenshotAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);

  useEffect(() => {
    if (clearTrigger !== undefined) {
      setRectangles([]);
      setCurrentRect(null);
    }
  }, [clearTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      redrawAnnotations();
    };
    img.src = screenshot;
  }, [screenshot]);

  const redrawAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx)
      return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;

      [...rectangles, ...(currentRect ? [currentRect] : [])].forEach((rect) => {
        ctx.strokeRect(rect.startX, rect.startY, rect.width, rect.height);
      });

      onAnnotatedScreenshot(canvas.toDataURL("image/png"));
    };
    img.src = screenshot;
  };

  useEffect(() => {
    redrawAnnotations();
  }, [rectangles, currentRect]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas)
      return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentRect({
      startX: pos.x,
      startY: pos.y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentRect)
      return;

    const pos = getMousePos(e);
    setCurrentRect({
      ...currentRect,
      width: pos.x - currentRect.startX,
      height: pos.y - currentRect.startY,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect)
      return;

    if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
      setRectangles([...rectangles, currentRect]);
    }

    setCurrentRect(null);
    setIsDrawing(false);
  };

  return (
    <div ref={containerRef} className="border border-border rounded overflow-hidden bg-surface">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-auto cursor-crosshair"
        style={{ display: "block" }}
      />
    </div>
  );
}

export default ScreenshotAnnotator;
