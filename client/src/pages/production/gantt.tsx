import { Card, PageHeader } from "@/components";

const sampleData = [
  {
    machine: "CNC Mill 1",
    tasks: [
      {
        name: "Job A",
        start: "2024-06-01T08:00:00",
        end: "2024-06-01T10:30:00",
        color: "var(--primary)",
        dependsOn: null,
      },
      {
        name: "Job B",
        start: "2024-06-01T11:00:00",
        end: "2024-06-01T14:00:00",
        color: "var(--success)",
        dependsOn: "Job A",
      },
      {
        name: "Job C",
        start: "2024-06-01T14:30:00",
        end: "2024-06-01T17:00:00",
        color: "var(--warning)",
        dependsOn: "Job B",
      },
      {
        name: "Job D",
        start: "2024-06-01T21:00:00",
        end: "2024-06-02T02:00:00",
        color: "var(--error)",
        dependsOn: "Job C",
      },
      {
        name: "Job E",
        start: "2024-06-02T03:00:00",
        end: "2024-06-02T08:00:00",
        color: "var(--info)",
        dependsOn: "Job D",
      },
      {
        name: "Job F",
        start: "2024-06-02T09:00:00",
        end: "2024-06-02T14:00:00",
        color: "var(--primary)",
        dependsOn: "Job E",
      },
      {
        name: "Job G",
        start: "2024-06-02T15:00:00",
        end: "2024-06-02T20:00:00",
        color: "var(--success)",
        dependsOn: "Job F",
      },
      {
        name: "Job H",
        start: "2024-06-02T21:00:00",
        end: "2024-06-03T02:00:00",
        color: "var(--warning)",
        dependsOn: "Job G",
      },
      {
        name: "Job I",
        start: "2024-06-03T03:00:00",
        end: "2024-06-03T08:00:00",
        color: "var(--info)",
        dependsOn: "Job H",
      },
      {
        name: "Job J",
        start: "2024-06-03T09:00:00",
        end: "2024-06-03T14:00:00",
        color: "var(--primary)",
        dependsOn: "Job I",
      },
    ],
  },
  {
    machine: "CNC Lathe 2",
    tasks: [
      {
        name: "Job K",
        start: "2024-06-01T09:00:00",
        end: "2024-06-01T11:00:00",
        color: "var(--error)",
        dependsOn: null,
      },
      {
        name: "Job L",
        start: "2024-06-01T11:30:00",
        end: "2024-06-01T14:00:00",
        color: "var(--info)",
        dependsOn: "Job K",
      },
      {
        name: "Job M",
        start: "2024-06-02T00:00:00",
        end: "2024-06-02T06:00:00",
        color: "var(--primary)",
        dependsOn: "Job L",
      },
      {
        name: "Job N",
        start: "2024-06-02T07:00:00",
        end: "2024-06-02T13:00:00",
        color: "var(--success)",
        dependsOn: "Job M",
      },
      {
        name: "Job O",
        start: "2024-06-02T14:00:00",
        end: "2024-06-02T20:00:00",
        color: "var(--warning)",
        dependsOn: "Job N",
      },
      {
        name: "Job P",
        start: "2024-06-02T21:00:00",
        end: "2024-06-03T03:00:00",
        color: "var(--info)",
        dependsOn: "Job O",
      },
      {
        name: "Job Q",
        start: "2024-06-03T04:00:00",
        end: "2024-06-03T10:00:00",
        color: "var(--primary)",
        dependsOn: "Job P",
      },
      {
        name: "Job R",
        start: "2024-06-03T11:00:00",
        end: "2024-06-03T17:00:00",
        color: "var(--success)",
        dependsOn: "Job Q",
      },
      {
        name: "Job S",
        start: "2024-06-03T18:00:00",
        end: "2024-06-04T00:00:00",
        color: "var(--warning)",
        dependsOn: "Job R",
      },
      {
        name: "Job T",
        start: "2024-06-04T01:00:00",
        end: "2024-06-04T07:00:00",
        color: "var(--info)",
        dependsOn: "Job S",
      },
    ],
  },
  {
    machine: "Laser Cutter",
    tasks: [
      {
        name: "Job U",
        start: "2024-06-01T10:00:00",
        end: "2024-06-01T12:00:00",
        color: "var(--primary)",
        dependsOn: null,
      },
      {
        name: "Job V",
        start: "2024-06-01T12:30:00",
        end: "2024-06-01T15:00:00",
        color: "var(--success)",
        dependsOn: "Job U",
      },
      {
        name: "Job W",
        start: "2024-06-01T19:00:00",
        end: "2024-06-02T00:00:00",
        color: "var(--warning)",
        dependsOn: "Job V",
      },
      {
        name: "Job X",
        start: "2024-06-02T01:00:00",
        end: "2024-06-02T06:00:00",
        color: "var(--info)",
        dependsOn: "Job W",
      },
      {
        name: "Job Y",
        start: "2024-06-02T07:00:00",
        end: "2024-06-02T12:00:00",
        color: "var(--primary)",
        dependsOn: "Job X",
      },
      {
        name: "Job Z",
        start: "2024-06-02T13:00:00",
        end: "2024-06-02T18:00:00",
        color: "var(--success)",
        dependsOn: "Job Y",
      },
      {
        name: "Job AA",
        start: "2024-06-02T19:00:00",
        end: "2024-06-03T00:00:00",
        color: "var(--warning)",
        dependsOn: "Job Z",
      },
      {
        name: "Job AB",
        start: "2024-06-03T01:00:00",
        end: "2024-06-03T06:00:00",
        color: "var(--info)",
        dependsOn: "Job AA",
      },
      {
        name: "Job AC",
        start: "2024-06-03T07:00:00",
        end: "2024-06-03T12:00:00",
        color: "var(--primary)",
        dependsOn: "Job AB",
      },
      {
        name: "Job AD",
        start: "2024-06-03T13:00:00",
        end: "2024-06-03T18:00:00",
        color: "var(--success)",
        dependsOn: "Job AC",
      },
    ],
  },
  {
    machine: "3D Printer",
    tasks: [
      {
        name: "Job AE",
        start: "2024-06-01T08:00:00",
        end: "2024-06-01T11:00:00",
        color: "var(--info)",
        dependsOn: null,
      },
      {
        name: "Job AF",
        start: "2024-06-01T12:00:00",
        end: "2024-06-01T20:00:00",
        color: "var(--primary)",
        dependsOn: "Job AE",
      },
      {
        name: "Job AG",
        start: "2024-06-02T00:00:00",
        end: "2024-06-02T06:00:00",
        color: "var(--success)",
        dependsOn: "Job AF",
      },
      {
        name: "Job AH",
        start: "2024-06-02T07:00:00",
        end: "2024-06-02T13:00:00",
        color: "var(--warning)",
        dependsOn: "Job AG",
      },
      {
        name: "Job AI",
        start: "2024-06-02T14:00:00",
        end: "2024-06-02T20:00:00",
        color: "var(--info)",
        dependsOn: "Job AH",
      },
      {
        name: "Job AJ",
        start: "2024-06-02T21:00:00",
        end: "2024-06-03T03:00:00",
        color: "var(--primary)",
        dependsOn: "Job AI",
      },
      {
        name: "Job AK",
        start: "2024-06-03T04:00:00",
        end: "2024-06-03T10:00:00",
        color: "var(--success)",
        dependsOn: "Job AJ",
      },
      {
        name: "Job AL",
        start: "2024-06-03T11:00:00",
        end: "2024-06-03T17:00:00",
        color: "var(--warning)",
        dependsOn: "Job AK",
      },
      {
        name: "Job AM",
        start: "2024-06-03T18:00:00",
        end: "2024-06-04T00:00:00",
        color: "var(--info)",
        dependsOn: "Job AL",
      },
      {
        name: "Job AN",
        start: "2024-06-04T01:00:00",
        end: "2024-06-04T07:00:00",
        color: "var(--primary)",
        dependsOn: "Job AM",
      },
    ],
  },
  {
    machine: "Waterjet",
    tasks: [
      {
        name: "Job AO",
        start: "2024-06-01T15:00:00",
        end: "2024-06-01T21:00:00",
        color: "var(--success)",
        dependsOn: null,
      },
      {
        name: "Job AP",
        start: "2024-06-02T00:00:00",
        end: "2024-06-02T06:00:00",
        color: "var(--primary)",
        dependsOn: "Job AO",
      },
      {
        name: "Job AQ",
        start: "2024-06-02T07:00:00",
        end: "2024-06-02T13:00:00",
        color: "var(--success)",
        dependsOn: "Job AP",
      },
      {
        name: "Job AR",
        start: "2024-06-02T14:00:00",
        end: "2024-06-02T20:00:00",
        color: "var(--warning)",
        dependsOn: "Job AQ",
      },
      {
        name: "Job AS",
        start: "2024-06-02T21:00:00",
        end: "2024-06-03T03:00:00",
        color: "var(--info)",
        dependsOn: "Job AR",
      },
      {
        name: "Job AT",
        start: "2024-06-03T04:00:00",
        end: "2024-06-03T10:00:00",
        color: "var(--primary)",
        dependsOn: "Job AS",
      },
      {
        name: "Job AU",
        start: "2024-06-03T11:00:00",
        end: "2024-06-03T17:00:00",
        color: "var(--success)",
        dependsOn: "Job AT",
      },
      {
        name: "Job AV",
        start: "2024-06-03T18:00:00",
        end: "2024-06-04T00:00:00",
        color: "var(--warning)",
        dependsOn: "Job AU",
      },
      {
        name: "Job AW",
        start: "2024-06-04T01:00:00",
        end: "2024-06-04T07:00:00",
        color: "var(--info)",
        dependsOn: "Job AV",
      },
      {
        name: "Job AX",
        start: "2024-06-04T08:00:00",
        end: "2024-06-04T14:00:00",
        color: "var(--primary)",
        dependsOn: "Job AW",
      },
    ],
  },
];

const MIN_BLOCK_WIDTH = 40; // Minimum width for a job block in px
const PIXELS_PER_MINUTE = 2; // Controls the zoom level of the chart

// Helper to get all tasks flattened
const allTasks = sampleData.flatMap((machine) => machine.tasks);

// Find the earliest start and latest end
const minStart = new Date(
  Math.min(...allTasks.map((t) => new Date(t.start).getTime()))
);
const maxEnd = new Date(
  Math.max(...allTasks.map((t) => new Date(t.end).getTime()))
);

// Round maxEnd up to the next hour
const roundedMaxEnd = new Date(maxEnd);
if (
  roundedMaxEnd.getMinutes() !== 0 ||
  roundedMaxEnd.getSeconds() !== 0 ||
  roundedMaxEnd.getMilliseconds() !== 0
) {
  roundedMaxEnd.setHours(roundedMaxEnd.getHours() + 1, 0, 0, 0);
}

// Calculate total minutes in the timeline
const totalMinutes = Math.ceil(
  (roundedMaxEnd.getTime() - minStart.getTime()) / 60000
);

// Generate time labels (every hour)
const timeLabels: Date[] = [];
for (
  let d = new Date(minStart);
  d < roundedMaxEnd;
  d.setHours(d.getHours() + 1, 0, 0, 0)
) {
  timeLabels.push(new Date(d));
}

const Gantt = () => {
  // Map a date to a left offset in px
  const getLeft = (date: string) =>
    ((new Date(date).getTime() - minStart.getTime()) / 60000) *
    PIXELS_PER_MINUTE;

  // Map a start/end to width in px
  const getWidth = (start: string, end: string) =>
    Math.max(
      ((new Date(end).getTime() - new Date(start).getTime()) / 60000) *
        PIXELS_PER_MINUTE,
      MIN_BLOCK_WIDTH
    );

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Production Gantt Chart"
        description="Visualize machine tasks and schedules"
      />
      <div className="p-2 ">
        <Card className="p-4">
          <div className="flex">
            {/* Sticky machine names */}
            <div className="flex flex-col w-44 flex-shrink-0">
              <div className="p-2 font-medium text-sm bg-background border border-border sticky top-0 z-20 h-10 text-text-muted">
                Machine
              </div>
              {sampleData.map((row) => (
                <div
                  key={row.machine}
                  className="p-2 bg-background border-b border-border text-sm font-medium whitespace-nowrap truncate sticky left-0 z-10 h-10 text-text-muted border-x">
                  {row.machine}
                </div>
              ))}
            </div>
            {/* Scrollable time area */}
            <div className="overflow-x-auto w-full">
              <div style={{ width: totalMinutes * PIXELS_PER_MINUTE }}>
                {/* Time header */}
                <div className="flex border-b bg-background sticky top-0 z-10 h-10 items-center">
                  {timeLabels.map((label, i) => {
                    // Calculate width for this interval
                    const next = timeLabels[i + 1] || roundedMaxEnd;
                    const minutes =
                      (new Date(next).getTime() - new Date(label).getTime()) /
                      60000;
                    const width = minutes * PIXELS_PER_MINUTE;
                    return (
                      <div
                        key={i}
                        className="text-xs text-text-muted border-l px-1 text-center text-nowrap h-full flex items-center justify-center"
                        style={{
                          width,
                          minWidth: width,
                        }}>
                        {label.toLocaleString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    );
                  })}
                </div>
                {/* Rows */}
                {sampleData.map((row) => (
                  <div
                    key={row.machine}
                    className="flex items-center group hover:bg-surface/50 h-10 relative">
                    {/* Hour grid lines */}
                    {timeLabels.slice(1).map((label, i) => (
                      <div
                        key={i}
                        className="absolute h-full border-l border-border"
                        style={{
                          left: getLeft(label.toISOString()),
                          width: 0,
                        }}
                      />
                    ))}
                    {/* Tasks */}
                    {row.tasks.map((task, tIdx) => (
                      <div
                        key={tIdx}
                        className="absolute h-7 top-1.5 rounded text-xs flex items-center justify-center font-medium text-white shadow"
                        style={{
                          left: getLeft(task.start),
                          width: getWidth(task.start, task.end),
                          background: task.color,
                          minWidth: MIN_BLOCK_WIDTH,
                        }}
                        title={`${task.name}: ${new Date(
                          task.start
                        ).toLocaleString()} - ${new Date(
                          task.end
                        ).toLocaleString()} (Depends on: ${
                          task.dependsOn || "None"
                        })`}>
                        {task.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Gantt;
