import { useState, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';

export const useUpdatePerformanceSheetLink = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateLink = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await instance.patch<IApiResponse<any>>(`/performance/links/${id}`, data);

      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.error || 'Failed to update performance sheet link');
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

  return { updateLink, loading, error };
};