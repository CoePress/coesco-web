import axios from "axios";
import { ProductClass } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import env from "@/config/env";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatCurrency = (amount: number, showCents: boolean = true) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
};

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  if (parts.length === 0) {
    return "0s";
  }

  return parts.join(" ");
};

export const openPopup = (module: string, params: string[]) => {
  window.open(
    `/${module}/popup?${params.join("&")}`,
    "_blank",
    "width=800,height=600"
  );
};

export const isProductClassDescendant = (
  childId: string,
  parentId: string,
  productClasses: ProductClass[]
): boolean => {
  const child = productClasses.find((pc) => pc.id === childId);
  if (!child) return false;
  if (child.parentId === parentId) return true;
  if (child.parentId) {
    return isProductClassDescendant(child.parentId, parentId, productClasses);
  }
  return false;
};

export const getStatusColor = (status: string, theme: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "#34d399";
    case "SETUP":
      return "#0284c7";
    case "IDLE":
      return "#ffab00";
    case "ALARM":
      return "#f44336";
    case "OFFLINE":
      return theme === "dark" ? "#262626" : "#f0f0f0";
    case "UNRECORDED":
      return theme === "dark" ? "#404040" : "#d4d4d4";
    default:
      return theme === "dark" ? "#262626" : "#f0f0f0";
  }
};

export const getVariantFromStatus = (status: string) => {
  const colors = {
    ACTIVE: "success",
    SETUP: "info",
    IDLE: "warning",
    ALARM: "error",
    OFFLINE: "default",
  };
  return colors[status as keyof typeof colors] || "default";
};

export const getStateColor = (state: string) => {
  const colors = {
    ACTIVE: "#22c55e", // Green
    IDLE: "#3b82f6", // Blue
    FEED_HOLD: "#eab308", // Yellow
    "E-STOP": "#ef4444", // Red
    ALARM: "#ef4444", // Red
    SETUP: "#f97316", // Orange
    TOOL_CHANGE: "#8b5cf6", // Purple
    POWER_ON: "#6b7280", // Gray
    HOMING: "#6b7280", // Gray
    RESET: "#6b7280", // Gray
    MAINTENANCE: "#f97316", // Orange
  };
  return colors[state as keyof typeof colors] || "#6b7280";
};

export const instance = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const pythonInstance = axios.create({
  baseURL: env.VITE_PYTHON_API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
pythonInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to Python backend:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
pythonInstance.interceptors.response.use(
  (response) => {
    console.log('Response received from Python backend:', response.status);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error - no response received');
      console.error('Error details:', error);
    } else {
      console.error('Response error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// Converts snake_case keys to camelCase recursively for objects and arrays
export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      acc[camelKey] = snakeToCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}
