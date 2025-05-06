import { useState } from "react";

type MachineStatus = {
  id: string;
  name: string;
  status: "running" | "setup" | "stopped" | "maintenance";
  uptime: string;
  currentJob: string;
  operator: string;
  estimatedCompletion: string;
  spindleLoad: number;
};

type MachineMapProps = {
  machines: MachineStatus[] | any[];
};

const MACHINE_POSITIONS: Record<string, { row: number; col: number }> = {
  "Haas VF-2": { row: 1, col: 1 },
  "DMG MORI NLX 2500": { row: 3, col: 1 },
  "Mazak QTN-200": { row: 1, col: 3 },
  "Okuma LB3000": { row: 3, col: 3 },
  "Haas ST-20": { row: 1, col: 6 },
  "DMG MORI DMU 50": { row: 1, col: 8 },
  "Doosan Puma 2600": { row: 3, col: 6 },
  "Mazak VTC-300C": { row: 3, col: 8 },
};

const getStatusColor = (status: MachineStatus["status"]) => {
  switch (status) {
    case "running":
      return "#22c55e"; // green
    case "setup":
      return "#eab308"; // yellow
    case "maintenance":
      return "#f97316"; // orange
    case "stopped":
    default:
      return "#ef4444"; // red
  }
};

const shadeColor = (color: string | undefined, percent: number) => {
  if (!color || !color.startsWith("#") || color.length !== 7) {
    return "#808080";
  }
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).padStart(2, "0");
  const GG = G.toString(16).padStart(2, "0");
  const BB = B.toString(16).padStart(2, "0");

  return "#" + RR + GG + BB;
};

const MachineMap = ({ machines }: MachineMapProps) => {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [gridSizeX] = useState(10);
  const [gridSizeY] = useState(5);

  const isoAngle = Math.PI / 6;
  const cos30 = Math.cos(isoAngle);
  const sin30 = Math.sin(isoAngle);

  const cellSize = 40;
  const width = Math.max(gridSizeX, gridSizeY) * cellSize * 2 * cos30;
  const height = (gridSizeX + gridSizeY) * cellSize * sin30;

  const handleBlockClick = (index: number) => {
    setSelectedBlock(selectedBlock === index ? null : index);
  };

  const isoCoord = (row: number, col: number) => {
    const x = (col - row) * cellSize * cos30;
    const y = (col + row) * cellSize * sin30;
    return { x: x + width / 2, y: y + cellSize };
  };

  const drawIsoBlock = (machine: MachineStatus, index: number) => {
    const position = MACHINE_POSITIONS[machine.name] || {
      row: Math.floor(index / 5),
      col: index % 5,
    };

    const color = getStatusColor(machine.status);
    const { x, y } = isoCoord(position.row, position.col);
    const size = 1;
    const depth = size * cellSize * sin30;

    const top = `
      M ${x} ${y - depth}
      L ${x + size * cellSize * cos30} ${y - depth + size * cellSize * sin30}
      L ${x} ${y - depth + size * cellSize * 2 * sin30}
      L ${x - size * cellSize * cos30} ${y - depth + size * cellSize * sin30}
      Z
    `;

    const right = `
      M ${x} ${y - depth + size * cellSize * 2 * sin30}
      L ${x + size * cellSize * cos30} ${y - depth + size * cellSize * sin30}
      L ${x + size * cellSize * cos30} ${y + size * cellSize * sin30}
      L ${x} ${y + size * cellSize * 2 * sin30}
      Z
    `;

    const left = `
      M ${x} ${y - depth + size * cellSize * 2 * sin30}
      L ${x - size * cellSize * cos30} ${y - depth + size * cellSize * sin30}
      L ${x - size * cellSize * cos30} ${y + size * cellSize * sin30}
      L ${x} ${y + size * cellSize * 2 * sin30}
      Z
    `;

    return (
      <g
        key={`block-${machine.id}`}
        onClick={() => handleBlockClick(index)}
        style={{ cursor: "pointer" }}
        className={`transition-opacity ${
          selectedBlock === null || selectedBlock === index
            ? "opacity-100"
            : "opacity-50"
        }`}>
        <path
          d={top}
          fill={color}
          stroke="#000"
          strokeWidth="1"
        />
        <path
          d={right}
          fill={shadeColor(color, -20)}
          stroke="#000"
          strokeWidth="1"
        />
        <path
          d={left}
          fill={shadeColor(color, -40)}
          stroke="#000"
          strokeWidth="1"
        />
        <text
          x={x}
          y={y + cellSize}
          textAnchor="middle"
          fill="var(--text)"
          fontSize="12"
          className="pointer-events-none select-none">
          {machine.name}
        </text>
      </g>
    );
  };

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < gridSizeY; row++) {
      for (let col = 0; col < gridSizeX; col++) {
        const { x, y } = isoCoord(row, col);

        const cellPath = `
          M ${x} ${y}
          L ${x + cellSize * cos30} ${y + cellSize * sin30}
          L ${x} ${y + cellSize * 2 * sin30}
          L ${x - cellSize * cos30} ${y + cellSize * sin30}
          Z
        `;

        cells.push(
          <path
            key={`cell-${row}-${col}`}
            d={cellPath}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="1"
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex-1 flex-col overflow-hidden items-center justify-center">
      <svg
        viewBox={`${width / 5} ${height / 3.5} ${width} ${height + 5}`}
        preserveAspectRatio="xMidYMid meet">
        <g transform={`translate(50, 50)`}>
          {renderGrid()}
          {machines.map((machine, index) => drawIsoBlock(machine, index))}
        </g>
      </svg>
    </div>
  );
};

export default MachineMap;
