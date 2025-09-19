import { useState } from "react";

import { useApi } from "../use-api";

export function useUpdateEntity(endpoint: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { patch } = useApi();

  const updateEntity = async (id: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await patch(`${endpoint}/${id}`, data);
      setLoading(false);
      return response;
    }
    catch (err: any) {
      setError(err.message || "Failed to update entity");
      setLoading(false);
      throw err;
    }
  };

  return { updateEntity, loading, error };
}
