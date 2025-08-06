import { useState, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';

export const useDeletePerformanceSheetLink = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteLink = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await instance.delete<IApiResponse<any>>(`/performance/links/${id}`);

      if (response.data.success) {
        return response.data;
      } else {
        setError(response.data.error || 'Failed to delete performance sheet link');
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

  return { deleteLink, loading, error };
};