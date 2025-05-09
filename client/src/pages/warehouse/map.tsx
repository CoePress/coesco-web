const BOX_SIZE = 40;
const ROWS = 8;
const COLS = 16;

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
  empty: { color: "#dff9fb", label: "Empty" },
};

// Example location zones for visual variety
const getBoxColor = (row: number, col: number) => {
  if (row < 2) return LOCATION_TYPES.dock.color;
  if (col < 3) return LOCATION_TYPES.storage.color;
  if (col > 12) return LOCATION_TYPES.packing.color;
  if (row > 5) return LOCATION_TYPES.picking.color;
  return LOCATION_TYPES.empty.color;
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

const WarehouseMap = () => {
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

  const drawIsoBlock = (row: number, col: number) => {
    const color = getBoxColor(row, col);
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
      <g key={`block-${row}-${col}`}>
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
    <div className="h-full p-2 text-sm">
      <div className="grid grid-cols-[1fr_300px] gap-2 h-full">
        {/* Main Map Card */}
        <div className="bg-foreground border border-border rounded shadow p-2 flex flex-col">
          <div className="font-medium text-text mb-4">Warehouse Map</div>
          <div className="flex-1 min-h-0">
            <svg
              viewBox={`${width / 5} ${height / 7} ${width} ${height + 20}`}
              preserveAspectRatio="xMidYMid meet">
              <g transform={`translate(50, 50)`}>
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
