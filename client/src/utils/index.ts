import { ProductClass } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
