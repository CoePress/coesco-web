import { AsyncLocalStorage } from "node:async_hooks";

export interface EmployeeContext {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  number: string;
  initials: string
}

export const contextStorage = new AsyncLocalStorage<EmployeeContext>();

export function getEmployeeContext() {
  const context = contextStorage.getStore();
  if (context)
    return context;

  return {
    id: "system",
    firstName: "System",
    lastName: "Account",
    email: "system@localhost",
    jobTitle: "Seeder",
    number: "SYS",
  };
}
