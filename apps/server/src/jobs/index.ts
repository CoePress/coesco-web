import { backupService } from "../lib/backup";
import { syncMicrosoftUsers } from "../lib/microsoft";

export const jobs = [
  {
    name: "db.backup",
    schedule: "0 3 * * *", // 3 AM daily
    run: async () => { await backupService.createBackup(); },
  },
  {
    name: "microsoft.sync",
    schedule: "0 2 * * *", // 2 AM daily
    run: async () => { await syncMicrosoftUsers(); },
  },
];
