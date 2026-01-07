import { syncMicrosoftUsers } from "../lib/microsoft";

export const jobs = [
  {
    name: "db.backup",
    schedule: "0 2 * * *",
    run: async () => {
      // backupDb()
    },
  },
  {
    name: "microsoft.sync",
    schedule: "0 2 * * *",
    run: async () => { await syncMicrosoftUsers(); },
  },
];
