import { Button } from "@/components";
import { useState, useMemo } from "react";

const BOX_SIZE = 40;
const ROWS = 8;
const COLS = 16;

const BUILDING_ROWS = 1;
const BUILDING_COLS = 16;

// Virtual location grid size
const VIRTUAL_ROWS = 3;
const VIRTUAL_COLS = 3;

const LOCATION_TYPES = {
  dock: { color: "#b0b0b0", label: "Dock" },
  storage: { color: "#6ab04c", label: "Storage" },
  picking: { color: "#2980b9", label: "Picking" },
  packing: { color: "#f9ca24", label: "Packing" },
  virtual_machining: { color: "#eb4d4b", label: "Virtual - Machining" },
  virtual_outside: { color: "#9b59b6", label: "Virtual - Outside" },
  empty: { color: "#2d3436", label: "Empty" },
  aisle: { color: "#ffffff", label: "Aisle" },
};

// Updated to include aisles and stacking
const getBoxColor = (row: number, col: number) => {
  // Create aisles every 3 columns
  if (col % 3 === 0) return LOCATION_TYPES.aisle.color;

  if (row < 2) return LOCATION_TYPES.dock.color;
  if (col < 3) return LOCATION_TYPES.storage.color;
  if (col > 12) return LOCATION_TYPES.packing.color;
  if (row > 5) return LOCATION_TYPES.picking.color;
  return LOCATION_TYPES.empty.color;
};

// Add stacking logic
const getStackHeight = (row: number, col: number) => {
  // Skip stacking for aisles
  if (col % 3 === 0) return 0;

  // Consistent stacking based on location type
  if (col < 3) return 3; // Storage areas always have 3 levels
  if (row < 2) return 2; // Dock areas have 2 levels
  if (col > 12) return 2; // Packing areas have 2 levels
  if (row > 5) return 2; // Picking areas have 2 levels
  return 2; // Empty areas have 2 levels
};

const shadeColor = (color: string, percent: number) => {
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

const VirtualLocation = ({
  type,
  title,
}: {
  type: "virtual_machining" | "virtual_outside";
  title: string;
}) => {
  const isoAngle = Math.PI / 6;
  const cos30 = Math.cos(isoAngle);
  const sin30 = Math.sin(isoAngle);

  const cellSize = BOX_SIZE;
  const width = Math.max(VIRTUAL_COLS, VIRTUAL_ROWS) * cellSize * 2 * cos30;
  const height = (VIRTUAL_COLS + VIRTUAL_ROWS) * cellSize * sin30;

  const isoCoord = (row: number, col: number) => {
    const x = (col - row) * cellSize * cos30;
    const y = (col + row) * cellSize * sin30;
    return { x: x + width / 2, y: y + cellSize };
  };

  const drawIsoBlock = (row: number, col: number) => {
    const color = LOCATION_TYPES[type].color;
    const { x, y } = isoCoord(row, col);
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
      <g key={`virtual-block-${row}-${col}`}>
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
      </g>
    );
  };

  return (
    <div className="bg-foreground border border-border rounded shadow p-2 text-sm">
      <div className="font-medium text-text mb-4">{title}</div>
      <div className="w-full h-[200px]">
        <svg
          viewBox={`${width / 4.1} ${height / 1.7} ${width} ${height + 20}`}
          preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(50, 50)`}>
            {Array.from({ length: VIRTUAL_ROWS }).map((_, row) =>
              Array.from({ length: VIRTUAL_COLS }).map((_, col) =>
                drawIsoBlock(row, col)
              )
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Add layer control interface
interface FilterState {
  jobNumber?: string;
  partNumber?: string;
  visibleLayers: number; // Track how many layers are visible
}

// Add building types and data
const BUILDING_TYPES = {
  neighbor: { color: "#404040", label: "Neighbor" },
  coe: { color: "#e8a80c", label: "COE" },
};

interface Building {
  id: string;
  type: keyof typeof BUILDING_TYPES;
  name: string;
  position: { row: number; col: number };
}

// Mock buildings data
const MOCK_BUILDINGS: Building[] = [
  {
    id: "w1",
    type: "coe",
    name: "Coe",
    position: { row: 1, col: 1 },
  },
  {
    id: "w2",
    type: "neighbor",
    name: "Neighbor",
    position: { row: 1, col: 3 },
  },
  {
    id: "w2",
    type: "neighbor",
    name: "Neighbor",
    position: { row: 1, col: 5 },
  },
  {
    id: "w2",
    type: "neighbor",
    name: "Neighbor",
    position: { row: 1, col: 7 },
  },
  {
    id: "w2",
    type: "coe",
    name: "Coe",
    position: { row: 1, col: 9 },
  },
  {
    id: "w2",
    type: "coe",
    name: "Coe",
    position: { row: 1, col: 11 },
  },
  {
    id: "w2",
    type: "neighbor",
    name: "Neighbor",
    position: { row: 1, col: 14 },
  },
  {
    id: "w2",
    type: "coe",
    name: "Coe",
    position: { row: 3, col: 14 },
  },
  {
    id: "w2",
    type: "coe",
    name: "Coe",
    position: { row: 5, col: 14 },
  },
];

// Add building view component
const BuildingView = ({
  onSelectBuilding,
}: {
  onSelectBuilding: (building: Building) => void;
}) => {
  const isoAngle = Math.PI / 6;
  const cos30 = Math.cos(isoAngle);
  const sin30 = Math.sin(isoAngle);

  const cellSize = BOX_SIZE;
  const width = Math.max(COLS, ROWS) * cellSize * 2 * cos30;
  const height = (COLS + ROWS) * cellSize * sin30;

  const isoCoord = (row: number, col: number) => {
    const x = (col - row) * cellSize * cos30;
    const y = (col + row) * cellSize * sin30;
    return { x: x + width / 2, y: y + cellSize };
  };

  // Add renderGrid function
  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
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

  const drawBuilding = (building: Building) => {
    const color = BUILDING_TYPES[building.type].color;
    const { x, y } = isoCoord(building.position.row, building.position.col);
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
        key={building.id}
        onClick={() => onSelectBuilding(building)}
        style={{ cursor: "pointer" }}>
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
          y={y - depth - 10}
          textAnchor="middle"
          fill="#000"
          fontSize="12"
          pointerEvents="none">
          {building.name}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-foreground border border-border rounded shadow p-2 flex flex-col">
      <div className="font-medium text-text mb-4">Building Map</div>
      <div className="flex-1 min-h-0">
        <svg
          viewBox={`${width / 5} ${height / 7} ${width} ${height + 20}`}
          preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(50, 50)`}>
            {renderGrid()}
            {MOCK_BUILDINGS.map(drawBuilding)}
          </g>
        </svg>
      </div>
    </div>
  );
};

const WarehouseMap = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null
  );
  const [filters, setFilters] = useState<FilterState>({
    visibleLayers: 3,
  });

  // Add function to handle layer visibility
  const handleLayerVisibility = (action: "add" | "remove") => {
    setFilters((prev) => {
      const currentMaxLayers = Math.max(
        ...Array.from({ length: ROWS }).map((_, row) =>
          Math.max(
            ...Array.from({ length: COLS }).map((_, col) =>
              getStackHeight(row, col)
            )
          )
        )
      );

      if (action === "add" && prev.visibleLayers < currentMaxLayers) {
        return { ...prev, visibleLayers: prev.visibleLayers + 1 };
      }
      if (action === "remove" && prev.visibleLayers > 1) {
        return { ...prev, visibleLayers: prev.visibleLayers - 1 };
      }
      return prev;
    });
  };

  // Add mock data for demonstration (replace with real data later)
  const mockLocationData = useMemo(() => {
    const data: Record<
      string,
      { jobNumber?: string; partNumber?: string; isFilled: boolean }
    > = {};
    // Populate some random data for demonstration
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (col % 3 !== 0) {
          // Skip aisles
          const key = `${row}-${col}`;
          data[key] = {
            jobNumber:
              Math.random() > 0.7
                ? `JOB-${Math.floor(Math.random() * 1000)}`
                : undefined,
            partNumber:
              Math.random() > 0.7
                ? `PART-${Math.floor(Math.random() * 1000)}`
                : undefined,
            isFilled: Math.random() > 0.5, // Random fill status
          };
        }
      }
    }
    return data;
  }, []);

  // Update locationMatchesFilters to make blocks to the right transparent
  const locationMatchesFilters = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const locationData = mockLocationData[key];

    if (!locationData) return true; // Aisles always match

    if (filters.jobNumber && locationData.jobNumber !== filters.jobNumber)
      return false;
    if (filters.partNumber && locationData.partNumber !== filters.partNumber)
      return false;

    return true;
  };

  const isoAngle = Math.PI / 6;
  const cos30 = Math.cos(isoAngle);
  const sin30 = Math.sin(isoAngle);

  const cellSize = BOX_SIZE;
  const width = Math.max(COLS, ROWS) * cellSize * 2 * cos30;
  const height = (COLS + ROWS) * cellSize * sin30;

  const isoCoord = (row: number, col: number) => {
    const x = (col - row) * cellSize * cos30;
    const y = (col + row) * cellSize * sin30;
    return { x: x + width / 2, y: y + cellSize };
  };

  // Update drawIsoBlock to use column-based focus
  const drawIsoBlock = (row: number, col: number) => {
    const baseColor = getBoxColor(row, col);
    const { x, y } = isoCoord(row, col);
    const size = 1;
    const maxStackHeight = getStackHeight(row, col);
    const depth = size * cellSize * sin30;

    // Calculate opacity based on filters and focus
    let opacity = 1;
    if (!locationMatchesFilters(row, col)) {
      opacity = 0.3;
    }

    // Get fill status from mock data
    const key = `${row}-${col}`;
    const locationData = mockLocationData[key];
    const isFilled = locationData?.isFilled ?? false;

    // Use base color if filled, otherwise use dark grey
    const color = isFilled ? baseColor : LOCATION_TYPES.empty.color;

    const blocks = [];

    // Draw stacked blocks up to visible layers
    for (let i = 0; i < Math.min(maxStackHeight, filters.visibleLayers); i++) {
      const yOffset = i * depth;

      const top = `
        M ${x} ${y - depth - yOffset}
        L ${x + size * cellSize * cos30} ${
        y - depth + size * cellSize * sin30 - yOffset
      }
        L ${x} ${y - depth + size * cellSize * 2 * sin30 - yOffset}
        L ${x - size * cellSize * cos30} ${
        y - depth + size * cellSize * sin30 - yOffset
      }
        Z
      `;

      const right = `
        M ${x} ${y - depth + size * cellSize * 2 * sin30 - yOffset}
        L ${x + size * cellSize * cos30} ${
        y - depth + size * cellSize * sin30 - yOffset
      }
        L ${x + size * cellSize * cos30} ${
        y + size * cellSize * sin30 - yOffset
      }
        L ${x} ${y + size * cellSize * 2 * sin30 - yOffset}
        Z
      `;

      const left = `
        M ${x} ${y - depth + size * cellSize * 2 * sin30 - yOffset}
        L ${x - size * cellSize * cos30} ${
        y - depth + size * cellSize * sin30 - yOffset
      }
        L ${x - size * cellSize * cos30} ${
        y + size * cellSize * sin30 - yOffset
      }
        L ${x} ${y + size * cellSize * 2 * sin30 - yOffset}
        Z
      `;

      blocks.push(
        <g key={`block-${row}-${col}-${i}`}>
          <path
            d={top}
            fill={color}
            stroke="#000"
            strokeWidth="1"
            opacity={opacity}
            style={{ cursor: "pointer" }}
          />
          <path
            d={right}
            fill={shadeColor(color, -20)}
            stroke="#000"
            strokeWidth="1"
            opacity={opacity}
            style={{ cursor: "pointer" }}
          />
          <path
            d={left}
            fill={shadeColor(color, -40)}
            stroke="#000"
            strokeWidth="1"
            opacity={opacity}
            style={{ cursor: "pointer" }}
          />
        </g>
      );
    }

    return <g key={`block-${row}-${col}`}>{blocks}</g>;
  };

  // Add renderGrid function for warehouse view
  const renderWarehouseGrid = () => {
    const cells = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
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

  if (!selectedBuilding) {
    return (
      <div className="h-full p-2 text-sm">
        <div className="grid grid-cols-[1fr_300px] gap-2 h-full">
          <BuildingView onSelectBuilding={setSelectedBuilding} />
          <div className="flex flex-col gap-2">
            <div className="bg-foreground border border-border rounded shadow p-2">
              <div className="font-medium text-text mb-4">Building Types</div>
              <div className="flex flex-col gap-2">
                {Object.entries(BUILDING_TYPES).map(
                  ([key, { color, label }]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          background: color,
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                        }}
                      />
                      <span className="text-sm text-text">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-2 text-sm">
      <div className="grid grid-cols-[1fr_300px] gap-2 h-full">
        <div className="bg-foreground border border-border rounded shadow p-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium text-text">
              {selectedBuilding.name} - Warehouse Map
            </div>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-blue-500 hover:text-blue-600">
              Back to Buildings
            </button>
          </div>

          {/* Add layer controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => handleLayerVisibility("remove")}
                disabled={filters.visibleLayers <= 1}>
                -
              </Button>
              <Button
                variant="secondary-outline"
                onClick={() => handleLayerVisibility("add")}
                disabled={filters.visibleLayers >= 3}>
                +
              </Button>
            </div>
          </div>

          {/* Add filter controls */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Job Number"
                value={filters.jobNumber || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    jobNumber: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Part Number"
                value={filters.partNumber || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    partNumber: e.target.value || undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <svg
              viewBox={`${width / 5} ${height / 7} ${width} ${height + 20}`}
              preserveAspectRatio="xMidYMid meet">
              <g transform={`translate(50, 50)`}>
                {renderWarehouseGrid()}
                {Array.from({ length: ROWS }).map((_, row) =>
                  Array.from({ length: COLS }).map((_, col) =>
                    drawIsoBlock(row, col)
                  )
                )}
              </g>
            </svg>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2">
          <VirtualLocation
            type="virtual_machining"
            title="Virtual - Machining"
          />
          <VirtualLocation
            type="virtual_outside"
            title="Virtual - Outside"
          />

          {/* Legend Card */}
          <div className="bg-foreground border border-border rounded shadow p-2">
            <div className="font-medium text-text mb-4">Location Types</div>
            <div className="flex flex-col gap-2">
              {Object.entries(LOCATION_TYPES).map(([key, { color, label }]) => (
                <div
                  key={key}
                  className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      background: color,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <span className="text-sm text-text">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseMap;
