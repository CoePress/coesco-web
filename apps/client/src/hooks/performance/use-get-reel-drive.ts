import { useState } from 'react';
import { pythonInstance } from '@/utils';

export const useGetReelDrive = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [fetchedReelDrive, setFetchedReelDrive] = useState<any>(null);

  const getReelDrive = async (reference: string) => {
    if (!reference) {
      setStatus('Please enter a reference number');
      return;
    }
    setIsLoading(true);
    try {
      const response = await pythonInstance.get(`/reel-drive/${reference}`);
      setFetchedReelDrive(response.data);
      setStatus('Reel Drive data fetched from backend!');
      return response.data;
    } catch (error: any) {
      setStatus('Failed to fetch Reel Drive data.');
      setFetchedReelDrive(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, status, fetchedReelDrive, getReelDrive };
}; 