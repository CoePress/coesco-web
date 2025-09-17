import { useState } from "react";
import { Modal, Button, Input } from "@/components";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";

interface TrackJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: any;
  onTrackingChange?: (isTracked: boolean) => void;
}

export const TrackJourneyModal = ({ 
  isOpen, 
  onClose, 
  journey, 
  onTrackingChange 
}: TrackJourneyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { post } = useApi();

  const handleTrackJourney = async () => {
    if (!user?.email || !journey?.id) return;
    
    setIsLoading(true);
    try {
      const result = await post(`/api/journey/${journey.id}/track`, {
        user_email: user.email,
        user_name: user.name || user.email
      });
      
      if (result) {
        onTrackingChange?.(true);
        onClose();
        // Show success toast/notification
      }
    } catch (error) {
      console.error("Error tracking journey:", error);
      // Show error toast/notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      title="Track Journey"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {journey?.name || journey?.Project_Name || journey?.Target_Account}
            </div>
            <div className="text-gray-600">
              ID: {journey?.id || journey?.ID} • Current Stage: {journey?.Journey_Stage || journey?.stage || "Unknown"}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            You'll receive email notifications when this journey is updated, including:
          </p>
          <ul className="text-xs text-gray-600 list-disc list-inside ml-2 space-y-1">
            <li>Stage changes</li>
            <li>Value updates</li>
            <li>Status changes</li>
            <li>Priority changes</li>
            <li>Date changes (presentation, decision, etc.)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> Your email ({user?.email}) will be used for notifications. 
              You can stop tracking at any time by clicking "Track Journey" again.
            </div>
          </div>
        </div>

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
            onClick={handleTrackJourney}
            disabled={isLoading}
          >
            {isLoading ? 'Setting up tracking...' : 'Start Tracking'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};