import { useState } from "react";
import { Modal, Button } from "@/components";
import { useApi } from "@/hooks/use-api";

interface UntrackJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: any;
  trackingInfo?: any;
  onTrackingChange?: (isTracked: boolean) => void;
}

export const UntrackJourneyModal = ({ 
  isOpen, 
  onClose, 
  journey, 
  trackingInfo,
  onTrackingChange 
}: UntrackJourneyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { delete: deleteApi } = useApi();

  const handleUntrackJourney = async () => {
    if (!journey?.id) return;
    
    setIsLoading(true);
    try {
      const result = await deleteApi(`/api/journey/${journey.id}/track`);
      
      if (result !== null) {
        onTrackingChange?.(false);
        onClose();
        // Show success toast/notification
      }
    } catch (error) {
      console.error("Error untracking journey:", error);
      // Show error toast/notification
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title="Stop Tracking Journey"
      size="sm"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {journey?.name || journey?.Project_Name || journey?.Target_Account}
            </div>
            <div className="text-gray-600">
              ID: {journey?.id || journey?.ID}
            </div>
            {trackingInfo && (
              <div className="text-xs text-gray-500 mt-1">
                Tracking since: {formatDate(trackingInfo.tracked_date)}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-700">
          Are you sure you want to stop tracking this journey? You will no longer receive email notifications for updates to this journey.
        </p>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUntrackJourney}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
          >
            {isLoading ? 'Removing...' : 'Stop Tracking'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};