export interface Stage {
  id: number;
  label: string;
  weight: number;
}

export interface PriorityConfig {
  style: string;
  color: string;
  label: string;
}

export interface StageCalculation {
  items: string[];
  stageTotal: number;
  stageWeighted: number;
}

export interface Journey {
  id: number | string;
  name?: string;
  companyName?: string;
  customerId?: string | number;
  stage?: number;
  priority?: string;
  value?: number;
  expectedDecisionDate?: string;
  Journey_Stage?: number;
  Journey_Value?: number;
  Priority?: string;
  Expected_Decision_Date?: string;
  CreateDT?: string;
  updatedAt?: string;
  Action_Date?: string;
  Quote_Presentation_Date?: string;
  Journey_Start_Date?: string;
  Target_Account?: string;
  Project_Name?: string;
  ID?: number | string;
  Competition?: string;
}

export interface Customer {
  id: string | number;
  name: string;
  Company_ID?: string | number;
}

export interface TrackingInfo {
  id: number;
  journey_id: number;
  user_email: string;
  user_name: string;
  tracked_date: string;
  notes?: string;
  is_active: boolean;
}

export const COMPETITION_OPTIONS = [
  "No Value Selected",
  "Arku",
  "Bradberry",
  "CHS",
  "Chinese Line Offering",
  "CoilTech",
  "Colt",
  "CWP",
  "Dallas",
  "Iowa Precision",
  "Mecon",
  "Ori",
  "Other",
  "PA Industries",
  "Perfecto",
  "Schuller",
  "Universal Feed",
] as const;
