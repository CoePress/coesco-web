import { AsyncLocalStorage } from "async_hooks";

export interface EmployeeContext {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  number: string;
}

export const contextStorage = new AsyncLocalStorage<EmployeeContext>();

export const getEmployeeContext = () => {
  const context = contextStorage.getStore();
  if (context) return context;

  return {
    id: "system",
    firstName: "System",
    lastName: "Account",
    email: "system@localhost",
    jobTitle: "Seeder",
    number: "SYS",
  };
};
