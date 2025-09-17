import { useTheme } from "@/contexts/theme.context";
import { getStatusColor } from "@/utils";
import { useState } from "react";

type MachineMapProps = {
  machines: any[];
};

const MACHINE_POSITIONS: Record<string, { row: number; col: number }> = {
  OKK: { row: 1, col: 1 },
  "Niigata SPN630": { row: 3, col: 1 },
  "Kuraki Boring Mill": { row: 1, col: 3 },
  "Niigata HN80": { row: 3, col: 3 },
  "Doosan 3100LS": { row: 1, col: 6 },
  "Mazak 200": { row: 1, col: 8 },
  "Mazak 350": { row: 3, col: 6 },
  "Mazak 450": { row: 3, col: 8 },
};

const shadeColor = (color: string | undefined, percent: number) => {
  if (!color) {
    return "#A0A0A0";
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
  const { theme } = useTheme();

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

  const drawIsoBlock = (machine: any, index: number) => {
    const position = MACHINE_POSITIONS[machine.name] || {
      row: Math.floor(index / 5),
      col: index % 5,
    };

    const color = getStatusColor(machine.status, theme);
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
