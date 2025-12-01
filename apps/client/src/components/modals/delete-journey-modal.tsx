import { Button, Modal } from "@/components";
import { formatCurrency } from "@/utils";

interface DeleteJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (e?: React.MouseEvent) => void;
  journey: any;
  isDeleting?: boolean;
}

export function DeleteJourneyModal({
  isOpen,
  onClose,
  onConfirm,
  journey,
  isDeleting = false,
}: DeleteJourneyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Journey"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-text">
          Are you sure you want to delete this journey? This action cannot be undone.
        </p>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-sm">
            <div className="font-medium text-white">
              {journey?.name || journey?.Project_Name || journey?.Target_Account}
            </div>
            <div className="text-gray-300">
              ID:
              {" "}
              {journey?.id || journey?.ID}
              {" "}
              • Value:
              {" "}
              {formatCurrency(Number(journey?.Journey_Value ?? journey?.value ?? 0))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-gray-800 hover:bg-gray-900 border-gray-800 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete Journey"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
