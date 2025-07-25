import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
  userId: string;
  employeeId: string;
  number: string;
  email?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  initials?: string;
  roles: string[];
  isActive: boolean;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext => {
  const ctx = contextStorage.getStore();
  if (!ctx) {
    throw new Error("RequestContext not set");
  }
  return ctx;
};

export const SYSTEM_CONTEXT: RequestContext = {
  userId: "system",
  employeeId: "system",
  number: "SYS",
  email: undefined,
  firstName: "System",
  lastName: "Account",
  jobTitle: "System",
  roles: ["SYSTEM"],
  isActive: true,
};
