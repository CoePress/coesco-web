import { useState, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';

export const useCreatePerformanceSheetVersion = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createVersion = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await instance.post<IApiResponse<any>>('/performance/versions', data);

      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.error || 'Failed to create performance sheet version');
        return null;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createVersion, loading, error };
};