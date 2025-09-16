import { useState, useEffect } from 'react';
import { useApi } from './use-api';
import { useAuth } from '@/contexts/auth.context';

interface TrackingInfo {
  id: number;
  journey_id: number;
  user_email: string;
  user_name: string;
  tracked_date: string;
  notes?: string;
  is_active: boolean;
}

export const useJourneyTracking = (journeyId: string | number) => {
  const [isTracked, setIsTracked] = useState<boolean>(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrackingStatus = async () => {
      if (!journeyId || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await get(`/api/journey/${journeyId}/tracking`);
        
        if (result && Array.isArray(result)) {
          // Find if current user is tracking this journey
          const userTracking = result.find((track: TrackingInfo) => 
            track.user_email === user.email && track.is_active
          );
          
          if (userTracking) {
            setIsTracked(true);
            setTrackingInfo(userTracking);
          } else {
            setIsTracked(false);
            setTrackingInfo(null);
          }
        } else {
          setIsTracked(false);
          setTrackingInfo(null);
        }
      } catch (error) {
        console.error('Error fetching tracking status:', error);
        setIsTracked(false);
        setTrackingInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingStatus();
  }, [journeyId, user?.email]);

  const refreshTracking = () => {
    if (journeyId && user?.email) {
      const fetchTrackingStatus = async () => {
        try {
          const result = await get(`/api/journey/${journeyId}/tracking`);
          
          if (result && Array.isArray(result)) {
            const userTracking = result.find((track: TrackingInfo) => 
              track.user_email === user.email && track.is_active
            );
            
            if (userTracking) {
              setIsTracked(true);
              setTrackingInfo(userTracking);
            } else {
              setIsTracked(false);
              setTrackingInfo(null);
            }
          } else {
            setIsTracked(false);
            setTrackingInfo(null);
          }
        } catch (error) {
          console.error('Error refreshing tracking status:', error);
        }
      };

      fetchTrackingStatus();
    }
  };

  return {
    isTracked,
    trackingInfo,
    loading,
    refreshTracking,
    setIsTracked, // For immediate UI updates
  };
};