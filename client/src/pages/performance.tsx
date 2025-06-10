import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components";

export const instance = axios.create({
  baseURL: "http://api.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const Performance = () => {
  const [sampleData, setSampleData] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const glassRef = useRef<HTMLDivElement>(null);

  const getData = async () => {
    const { data } = await instance.get<any>(`/performance`);
    setSampleData(data);
  };

  const createData = async () => {
    const response = await instance.post<any>(`/performance`, {
      name: "John Doe",
      email: "john.doe@example.com",
    });
    console.log(response);
  };

  const handleClick = () => {
    createData();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (glassRef.current) {
      const rect = glassRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    getData();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=2070&auto=format&fit=crop')",
      }}
      onMouseMove={handleMouseMove}>
      <div
        ref={glassRef}
        className="absolute w-[420px] h-24 rounded-full cursor-move shadow-2xl"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.25) 60%, rgba(255,255,200,0.18) 100%)",
          borderImage: "linear-gradient(90deg, #fff8, #ffe066, #fff8) 1",
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.18), 0 1.5px 0 0 #fff6 inset",
          backdropFilter: "blur(18px) saturate(1.5)",
          WebkitBackdropFilter: "blur(18px) saturate(1.5)",
          overflow: "hidden",
        }}
        onMouseDown={handleMouseDown}>
        {/* Noise/warp overlay for refraction illusion */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
          }}
          viewBox="0 0 420 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <filter
            id="noise"
            x="0"
            y="0">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              result="turb"
            />
            <feColorMatrix
              type="saturate"
              values="0.2"
            />
            <feComponentTransfer>
              <feFuncA
                type="linear"
                slope="0.08"
              />
            </feComponentTransfer>
          </filter>
          <rect
            width="420"
            height="96"
            filter="url(#noise)"
          />
        </svg>
        {/* Inner highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "9999px",
            boxShadow: "0 2px 16px 0 #fff6 inset",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};

export default Performance;
