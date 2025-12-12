export const jobs = [
  {
    name: "db.backup",
    schedule: "0 2 * * *",
    run: async () => {
      // backupDb()
    },
  },
];
