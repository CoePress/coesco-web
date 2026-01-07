import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/modal";
import { Button } from "@/components";

interface JourneyNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  journeyName: string;
  journeyId: string;
}

export const JourneyNavigationModal = ({
  isOpen,
  onClose,
  journeyName,
  journeyId,
}: JourneyNavigationModalProps) => {
  const navigate = useNavigate();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Journey Created Successfully!"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-text">
          Journey "{journeyName}" has been created successfully.
        </p>
        <p className="text-text-muted text-sm">
          Would you like to open the journey details now?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onClose}
          >
            Stay Here
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              navigate(`/sales/pipeline/${journeyId}`);
            }}
          >
            Open Journey Details
          </Button>
        </div>
      </div>
    </Modal>
  );
};
