import { IBaseEntity } from "./schema.types";

export enum ProductClassStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum QuoteStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum ItemType {
  PRODUCT = "PRODUCT",
  MATERIAL = "MATERIAL",
  SERVICE = "SERVICE",
  DISCOUNT = "DISCOUNT",
}

export interface IProductClass extends IBaseEntity {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  status: ProductClassStatus;
}

export interface IOptionCategory extends IBaseEntity {
  name: string;
  description?: string;
  isRequired: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  productClassIds: string[];
}

export interface IQuantityBounds {
  min: number;
  max: number;
}

export interface IOption extends IBaseEntity {
  name: string;
  description?: string;
  price: number;
  isStandard: boolean;
  allowQuantity: boolean;
  quantity?: IQuantityBounds;
  displayOrder: number;
  categoryId: string;
}

// Quote
export interface IQuoteHeader extends IBaseEntity {
  quoteNumber: string;
  quoteYear: string;
  customerId: string;
  dealerId: string;
  status: QuoteStatus;
  createdBy: string;
}

export interface IQuoteDetail extends IBaseEntity {
  quoteHeaderId: string;
  revision: string;
  status: string;
}

export interface IQuoteItem extends IBaseEntity {
  quoteDetailsId: string;
  itemType: ItemType;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
