import { useState, useEffect, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';

export const useGetPerformanceSheetLinks = (sheetId?: string) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      if (!sheetId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<any[]>>(`/performance/links/sheet/${sheetId}`);

        if (data.success) {
          setLinks(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch performance sheet links');
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError('An error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [sheetId, refreshToggle]);

  const refresh = useCallback(() => setRefreshToggle(prev => !prev), []);

  return { links, loading, error, refresh };
};