export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductClass extends IBaseEntity {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  depth: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface OptionCategory extends IBaseEntity {
  name: string;
  description?: string;
  isRequired: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  productClassIds: string[];
}

export interface Option extends IBaseEntity {
  name: string;
  description?: string;
  price: number;
  isStandard: boolean;
  allowQuantity: boolean;
  quantityMin?: number;
  quantityMax?: number;
  displayOrder: number;
  categoryId: string;
  productClassIds?: string[];
}

export interface SelectedOption {
  optionId: string;
  quantity: number;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

export interface Rule extends IBaseEntity {
  name: string;
  description: string;
  type: "OPTION" | "INPUT";
  active: boolean;
  priority: number;
  action: RuleAction;
  condition: RuleCondition;
  targetOptionIds: string[];
}

export type RuleCondition =
  | InputCondition
  | SimpleCondition
  | AndCondition
  | OrCondition
  | NotCondition;

export interface InputCondition {
  type: "INPUT";
  fieldId: string;
  operator: ComparisonOperator;
  value: InputValue;
}

export interface SimpleCondition {
  type: "SIMPLE";
  conditionType: "OPTION" | "PRODUCT_CLASS";
  id: string;
  state?: "SELECTED" | "NOT_SELECTED";
}

export interface AndCondition {
  type: "AND";
  conditions: RuleCondition[];
}

export interface OrCondition {
  type: "OR";
  conditions: RuleCondition[];
}

export interface NotCondition {
  type: "NOT";
  condition: RuleCondition;
}

export enum RuleAction {
  DISABLE = "DISABLE",
  REQUIRE = "REQUIRE",
}

export enum ComparisonOperator {
  GREATER_THAN = ">",
  GREATER_THAN_OR_EQUAL = ">=",
  LESS_THAN = "<",
  LESS_THAN_OR_EQUAL = "<=",
  EQUAL = "==",
  NOT_EQUAL = "!=",
}

export type InputValue = string | number | boolean;

export interface Configuration {
  id: string;
  name: string;
  description?: string;
  image?: string;
  productClassId: string;
  options: Array<{
    optionId: string;
    quantity: number;
  }>;
  pricing: {
    basePrice: number;
    adjustments: number;
    totalPrice: number;
  };
  status: ConfigurationStatus;
  isTemplate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export enum ConfigurationStatus {
  DRAFT = "DRAFT",
  VALID = "VALID",
  INVALID = "INVALID",
  PUBLISHED = "PUBLISHED",
}
