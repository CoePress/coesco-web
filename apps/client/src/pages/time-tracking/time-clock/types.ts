export type TimeClockPage =
    | 'TimeClock'           // Hub page
    | 'SelectOp'            // Operation Selection
    | 'SelectJobParts'      // Cost Code Selection  
    | 'UnitsProd'           // Production Entry/Clock Out
    | 'Hours'               // Hours Review/Management
    | 'SplitHours'          // Split Hours
    | 'EditHoursEmp'        // Employee Hour Editing
    | 'History'             // Time History
    | 'HistoryDisplay'      // History Display
    | 'EditHoursMan'        // Manager Hour Editing
    | 'ManagerAddHours';    // Manager Add Hours

export interface Employee {
    empNum: number;
    name: string;
    isClockedIn: boolean;
    currentJob?: string;
    currentOperation?: string;
    askUnits?: boolean;     // Job requires units tracking
    askSplit?: boolean;     // Job allows split hours
}

export interface NavigationContext {
    fromPage?: TimeClockPage;
    flowType?: 'clockin' | 'clockout' | 'changeoperation' | 'viewhours';
    selectedOperation?: string;
    selectedJob?: string;
    selectedPart?: string;
    dateRange?: string;
    data?: any;
}

export interface BasePageProps {
    currentEmployee: Employee;
    navigationContext: NavigationContext;
    NavigateToPage: (page: TimeClockPage, context?: NavigationContext) => void;
    NavigateToRootPage: () => void;
    ClockInAsync: () => Promise<void>;
    ClockOutAsync: () => Promise<void>;
}
