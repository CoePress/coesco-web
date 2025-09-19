import { useApi } from "@/hooks/use-api";

const { get } = useApi();

export async function generateUniqueId(
  tableName: string,
  idFieldName: string,
  database: string = "std",
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const newId = crypto.randomUUID();

    try {
      const response = await get(
        `/legacy/${database}/${tableName}/filter/custom`,
        { [idFieldName]: newId },
      );

      const existingRecords = response;

      if (!existingRecords || !Array.isArray(existingRecords) || existingRecords.length === 0) {
        return newId;
      }
    }
    catch (error: any) {
      if (error.response?.status === 404 || error.response?.data === null) {
        return newId;
      }

      console.error("Error checking ID uniqueness:", error);
      return newId;
    }

    attempts++;
  }

  throw new Error(`Failed to generate unique ID for table ${tableName} after ${maxAttempts} attempts`);
}

export async function generateUniqueNumericId(
  tableName: string,
  idFieldName: string,
  database: string = "std",
): Promise<number> {
  try {
    const result = await get(
      `/legacy/${database}/${tableName}/${idFieldName}/max`,
    );
    const maxValue = result?.maxValue || 0;
    return maxValue + 1;
  }
  catch (error: any) {
    console.error("Error getting max ID:", error);
    return Math.floor(Math.random() * 1000000) + 1;
  }
}
