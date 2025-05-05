export const formatDuration = (ms: number): string => {
  if (!ms && ms !== 0) return "-";
  if (ms < 0) ms = 0;

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = ((ms % (1000 * 60)) / 1000).toFixed();

  const parts = [
    days > 0 && `${days}d`,
    hours > 0 && `${hours}h`,
    minutes > 0 && `${minutes}m`,
    Number(seconds) > 0 && `${seconds}s`,
  ];

  return parts.filter(Boolean).join(" ") || "0s";
};

export function decompressTimelineData(data: any): any {
  if (data.states) {
    return data;
  }

  if (!data.m || !data.b || !data.s) {
    return {
      machineId: "unknown",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      states: [],
      labels: [],
    };
  }

  try {
    const decompressed = {
      machineId: data.m,
      startedAt: new Date(data.b).toISOString(),
      endedAt: new Date(data.e).toISOString(),
      states: data.s.map((s: any) => {
        const startedAt = new Date(data.b + s[1]);
        const endedAt = new Date(data.b + s[1] + s[2]);

        return {
          sequenceNumber: s[0],
          startedAt: startedAt,
          endedAt: endedAt,
          state: data.c[s[3]],
          duration: s[2],
          id: `state-${s[0]}`,
        };
      }),
      labels: data.l || [],
    };

    return decompressed;
  } catch (error) {
    return {
      machineId: data.m || "unknown",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      states: [],
      labels: [],
    };
  }
}

export const STATUS_MAPPING = {
  success: {
    states: ["active", "user", "success", "online"],
    color: "#00C49F",
    border: "border-success/75",
    text: "text-success",
    background: "bg-success/10",
    fill: "fill-success",
  },
  progress: {
    states: ["setup", "manager"],
    color: "#0080FF",
    border: "border-info/75",
    text: "text-info",
    background: "bg-info/10",
    fill: "fill-info",
  },
  warning: {
    states: ["ready", "idle", "feed_hold", "stopped", "stop"],
    color: "#FFBB28",
    border: "border-warning/75",
    text: "text-warning",
    background: "bg-warning/10",
    fill: "fill-warning",
  },
  error: {
    states: ["interrupted", "error", "admin"],
    color: "#FF6347",
    border: "border-error/75",
    text: "text-error",
    background: "bg-error/10",
    fill: "fill-error",
  },
  offline: {
    states: ["unknown", "unavailable", "inactive", "offline"],
    color: "#808080",
    border: "border-default/75",
    text: "text-default",
    background: "bg-default/10",
    fill: "fill-default",
  },
} as const;
