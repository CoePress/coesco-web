import type { MachineType } from "@coesco/types";

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: { input: string; types: string[] },
              callback: (predictions: any[], status: string) => void
            ) => void;
          };
          PlacesService: new (div: HTMLElement) => {
            getDetails: (
              request: { placeId: string; fields: string[] },
              callback: (place: any, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
          };
        };
        Map: new (element: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        SymbolPath: {
          CIRCLE: number;
        };
      };
    };
    trackingInterval: ReturnType<typeof setInterval> | null;
  }
}

export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface IQueryParams<T> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Partial<T> | string;
  search?: string;
  searchFields?: Array<keyof T>;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  include?: string[] | Record<string, any> | string;
  select?: string[] | Record<string, any> | string;
}

export interface IStateDistribution {
  state: string;
  total: number;
  percentage: number;
}

export interface IOverviewMachine {
  id: string;
  name: string;
  type: MachineType;
}

export interface IOverviewAlarm {
  machineId: string;
  timestamp: Date;
  message: string;
}

export interface IMachineOverview {
  startDate: Date;
  endDate: Date;
  kpis: any[];
  utilization: any[];
  states: IStateDistribution[];
  machines: IOverviewMachine[];
  alarms: IOverviewAlarm[];
}

export interface IMachineTimeline {
  startDate: Date;
  endDate: Date;
  machines: IOverviewMachine[];
}
